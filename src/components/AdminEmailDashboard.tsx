import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  Heading1,
  Image as ImageIcon,
  Loader2,
  Mail,
  Plus,
  RefreshCcw,
  Send,
  ShieldCheck,
  Trash2,
  Type,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  EMAIL_LINKS,
  type EmailBlock,
  type EmailButtonBlock,
  type EmailButtonTone,
  type EmailComposerDraft,
  type EmailHeadingBlock,
  type EmailImageBlock,
  type EmailImageWidth,
  type EmailParagraphBlock,
  type EmailSpacerBlock,
  type EmailSpacerSize,
  createBlockId,
  createDefaultRecapDraft,
} from '../lib/emailComposer';

interface AudienceCounts {
  subscribed_total: number;
  subscribed_with_predictions: number;
  unsubscribed_total: number;
  production_segment_count: number;
}

interface EmailSendLog {
  id: string;
  created_at: string;
  mode: 'test' | 'send';
  segment: string | null;
  test_email: string | null;
  subject: string;
  recipient_count: number;
  status: 'started' | 'succeeded' | 'failed';
  error_message: string | null;
}

interface SendBrevoEmailResponse {
  ok?: boolean;
  error?: string;
  recipientCount?: number;
}

const FIXED_SEGMENT = 'season_2025_participants';

type Notice = { tone: 'success' | 'error'; message: string } | null;

const imageWidthOptions: Array<{ value: EmailImageWidth; label: string }> = [
  { value: 'full', label: 'Full' },
  { value: 'wide', label: 'Wide' },
  { value: 'medium', label: 'Medium' },
];

const spacerOptions: Array<{ value: EmailSpacerSize; label: string }> = [
  { value: 's', label: 'Small' },
  { value: 'm', label: 'Medium' },
  { value: 'l', label: 'Large' },
];

const buttonToneOptions: Array<{ value: EmailButtonTone; label: string }> = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
];

function getImageBlockWidthClass(width: EmailImageWidth) {
  if (width === 'medium') return 'max-w-[72%]';
  if (width === 'wide') return 'max-w-[92%]';
  return 'max-w-full';
}

function getImageBlockWidthPercent(width: EmailImageWidth) {
  if (width === 'medium') return '72%';
  if (width === 'wide') return '92%';
  return '100%';
}

function getSpacerHeight(size: EmailSpacerSize) {
  if (size === 's') return '24px';
  if (size === 'l') return '56px';
  return '40px';
}

function clampMoveIndex(index: number, direction: -1 | 1, length: number) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= length) return index;
  return nextIndex;
}

function EmailPreviewBlock({ block }: { block: EmailBlock }) {
  if (block.type === 'heading') {
    return <h2 className="text-[30px] font-black leading-tight tracking-tight text-bears-navy">{block.text}</h2>;
  }

  if (block.type === 'paragraph') {
    return (
      <p className="text-[18px] leading-[1.68] text-slate-700 whitespace-pre-wrap">
        {block.text}
      </p>
    );
  }

  if (block.type === 'image') {
    return (
      <div className={`mx-auto ${getImageBlockWidthClass(block.width)}`}>
        <a href={block.href || '#'} className="block" onClick={(event) => event.preventDefault()}>
          <img
            src={block.src}
            alt={block.alt}
            className={`block w-full h-auto ${block.framed === false ? '' : 'rounded-[24px] border border-slate-200'}`}
          />
        </a>
        {block.caption && <p className="pt-2 text-sm leading-6 text-slate-500">{block.caption}</p>}
      </div>
    );
  }

  if (block.type === 'button') {
    const toneClass =
      block.tone === 'primary'
        ? 'bg-bears-orange text-white'
        : 'border border-slate-300 bg-white text-slate-800';
    return (
      <div className="text-center">
        <a
          href={block.href}
          onClick={(event) => event.preventDefault()}
          className={`inline-flex rounded-full px-6 py-3 text-base font-bold ${toneClass}`}
        >
          {block.label}
        </a>
      </div>
    );
  }

  return <div style={{ height: getSpacerHeight(block.size) }} />;
}

function EmailPreviewButtonRow({ buttons }: { buttons: EmailButtonBlock[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-3">
      {buttons.map((button) => {
        const toneClass =
          button.tone === 'primary'
            ? 'bg-bears-orange text-white'
            : 'border border-slate-300 bg-white text-slate-800';

        return (
          <a
            key={button.id}
            href={button.href}
            onClick={(event) => event.preventDefault()}
            className={`inline-flex rounded-full px-6 py-3 text-[16px] font-bold ${toneClass}`}
          >
            {button.label}
          </a>
        );
      })}
    </div>
  );
}

function ComposerPreview({ draft }: { draft: EmailComposerDraft }) {
  const previewBlocks: Array<{ key: string; content: JSX.Element }> = [];

  for (let index = 0; index < draft.blocks.length; index += 1) {
    const block = draft.blocks[index];

    if (block.type === 'button') {
      const buttons: EmailButtonBlock[] = [block];

      while (index + 1 < draft.blocks.length && draft.blocks[index + 1].type === 'button') {
        buttons.push(draft.blocks[index + 1] as EmailButtonBlock);
        index += 1;
      }

      previewBlocks.push({
        key: buttons.map((button) => button.id).join('-'),
        content: <EmailPreviewButtonRow buttons={buttons} />,
      });
      continue;
    }

    previewBlocks.push({
      key: block.id,
      content: <EmailPreviewBlock block={block} />,
    });
  }

  return (
    <div className="rounded-[32px] border border-slate-200 bg-slate-100 p-4 shadow-sm">
      <div className="mx-auto max-w-[620px] overflow-hidden rounded-[24px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="bg-bears-navy px-5 py-5 text-center">
          <div className="text-[20px] font-extrabold tracking-[0.01em] text-white">Bears Prediction Tracker</div>
        </div>

        <div className="px-5 py-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-bears-orange">2025 Season Recap</p>
          <h1 className="mt-3 text-[36px] font-black leading-[1.05] tracking-tight text-bears-navy">
            How Bears Fans Predicted the Season
          </h1>
          <p className="mt-4 text-[13px] font-bold uppercase tracking-[0.18em] text-slate-500">IRFAN | MAR 31</p>

          <div className="mt-8 space-y-9">
            {previewBlocks.map((block) => (
              <div key={block.key}>{block.content}</div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-10 text-center text-[15px] leading-7 text-slate-500">
          <a href={EMAIL_LINKS.recap} onClick={(event) => event.preventDefault()} className="underline">
            View the recap on the site
          </a>
          <span className="px-2 text-slate-300">|</span>
          <span className="underline">Unsubscribe</span>
        </div>
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  block: EmailBlock;
  index: number;
  total: number;
  onChange: (block: EmailBlock) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const frame = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm';

  return (
    <div className={frame}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
            {block.type}
          </span>
          <span className="text-sm font-semibold text-slate-500">Block {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 disabled:opacity-40"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-red-200 p-2 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {block.type === 'heading' && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Heading</label>
            <textarea
              value={block.text}
              onChange={(event) => onChange({ ...block, text: event.target.value } satisfies EmailHeadingBlock)}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
            />
          </div>
        )}

        {block.type === 'paragraph' && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Paragraph</label>
            <textarea
              value={block.text}
              onChange={(event) => onChange({ ...block, text: event.target.value } satisfies EmailParagraphBlock)}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
            />
          </div>
        )}

        {block.type === 'image' && (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Image URL</label>
              <input
                type="url"
                value={block.src}
                onChange={(event) => onChange({ ...block, src: event.target.value } satisfies EmailImageBlock)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Alt text</label>
                <input
                  type="text"
                  value={block.alt}
                  onChange={(event) => onChange({ ...block, alt: event.target.value } satisfies EmailImageBlock)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Click URL</label>
                <input
                  type="url"
                  value={block.href ?? ''}
                  onChange={(event) =>
                    onChange({ ...block, href: event.target.value || undefined } satisfies EmailImageBlock)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Width</label>
                <select
                  value={block.width}
                  onChange={(event) =>
                    onChange({ ...block, width: event.target.value as EmailImageWidth } satisfies EmailImageBlock)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
                >
                  {imageWidthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={block.framed !== false}
                  onChange={(event) =>
                    onChange({ ...block, framed: event.target.checked } satisfies EmailImageBlock)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-bears-orange focus:ring-bears-orange"
                />
                Show frame around image
              </label>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Caption</label>
              <input
                type="text"
                value={block.caption ?? ''}
                onChange={(event) =>
                  onChange({ ...block, caption: event.target.value || undefined } satisfies EmailImageBlock)
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
              />
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Current display width: {getImageBlockWidthPercent(block.width)}
            </div>
          </>
        )}

        {block.type === 'button' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Label</label>
                <input
                  type="text"
                  value={block.label}
                  onChange={(event) => onChange({ ...block, label: event.target.value } satisfies EmailButtonBlock)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Tone</label>
                <select
                  value={block.tone}
                  onChange={(event) =>
                    onChange({ ...block, tone: event.target.value as EmailButtonTone } satisfies EmailButtonBlock)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
                >
                  {buttonToneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Link</label>
              <input
                type="url"
                value={block.href}
                onChange={(event) => onChange({ ...block, href: event.target.value } satisfies EmailButtonBlock)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
              />
            </div>
          </>
        )}

        {block.type === 'spacer' && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Spacer size</label>
            <select
              value={block.size}
              onChange={(event) =>
                onChange({ ...block, size: event.target.value as EmailSpacerSize } satisfies EmailSpacerBlock)
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
            >
              {spacerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminEmailDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<AudienceCounts | null>(null);
  const [sendLogs, setSendLogs] = useState<EmailSendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email ?? '');
  const [draft, setDraft] = useState<EmailComposerDraft>(() => createDefaultRecapDraft());
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingProduction, setSendingProduction] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setTestEmail((current) => current || user.email || '');
    }
  }, [user?.email]);

  useEffect(() => {
    void loadPageData();
  }, []);

  const productionCount = counts?.production_segment_count ?? 0;

  const statCards = useMemo(() => {
    if (!counts) return [];

    return [
      { label: 'Subscribed Users', value: counts.subscribed_total, icon: Users },
      { label: 'Subscribed With Predictions', value: counts.subscribed_with_predictions, icon: ShieldCheck },
      { label: 'Unsubscribed', value: counts.unsubscribed_total, icon: Mail },
      { label: 'Send Segment Count', value: counts.production_segment_count, icon: Send },
    ];
  }, [counts]);

  const imageLibrary = useMemo(
    () => [
      { label: 'Hero', url: 'https://bearsprediction.com/email/recap-2025/hero.jpg' },
      { label: 'Accuracy Chart', url: 'https://bearsprediction.com/email/recap-2025/community-accuracy.png' },
      { label: 'Caleb Record', url: 'https://bearsprediction.com/email/recap-2025/caleb-record.png' },
      { label: 'Playoff Split', url: 'https://bearsprediction.com/email/recap-2025/playoff-split.png' },
      { label: 'Odunze Stats', url: 'https://bearsprediction.com/email/recap-2025/rome-odunze.png' },
      { label: 'Offense Surprise', url: 'https://bearsprediction.com/email/recap-2025/offense-surprise.png' },
      { label: 'Draft Chart', url: 'https://bearsprediction.com/email/recap-2025/draft-pick.png' },
    ],
    []
  );

  async function loadPageData(showRefreshState = false) {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [{ data: countRows, error: countError }, { data: logs, error: logsError }] = await Promise.all([
        supabase.rpc('get_admin_email_audience_counts'),
        supabase
          .from('email_send_logs')
          .select('id, created_at, mode, segment, test_email, subject, recipient_count, status, error_message')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      if (countError) throw countError;
      if (logsError) throw logsError;

      const row = Array.isArray(countRows) ? countRows[0] : countRows;
      setCounts({
        subscribed_total: Number(row?.subscribed_total ?? 0),
        subscribed_with_predictions: Number(row?.subscribed_with_predictions ?? 0),
        unsubscribed_total: Number(row?.unsubscribed_total ?? 0),
        production_segment_count: Number(row?.production_segment_count ?? 0),
      });
      setSendLogs((logs ?? []) as EmailSendLog[]);
    } catch (error) {
      console.error('Failed to load admin email data:', error);
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Failed to load email admin data.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function updateBlock(blockId: string, updatedBlock: EmailBlock) {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === blockId ? updatedBlock : block)),
    }));
  }

  function removeBlock(blockId: string) {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }));
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    setDraft((current) => {
      const currentIndex = current.blocks.findIndex((block) => block.id === blockId);
      if (currentIndex === -1) return current;
      const nextIndex = clampMoveIndex(currentIndex, direction, current.blocks.length);
      if (nextIndex === currentIndex) return current;
      const blocks = [...current.blocks];
      const [moved] = blocks.splice(currentIndex, 1);
      blocks.splice(nextIndex, 0, moved);
      return { ...current, blocks };
    });
  }

  function addBlock(type: EmailBlock['type']) {
    let nextBlock: EmailBlock;

    if (type === 'heading') {
      nextBlock = { id: createBlockId('heading'), type: 'heading', text: 'New heading' };
    } else if (type === 'paragraph') {
      nextBlock = { id: createBlockId('paragraph'), type: 'paragraph', text: 'New paragraph' };
    } else if (type === 'image') {
      nextBlock = {
        id: createBlockId('image'),
        type: 'image',
        src: imageLibrary[0]?.url ?? '',
        alt: 'Email image',
        width: 'full',
        framed: false,
      };
    } else if (type === 'button') {
      nextBlock = {
        id: createBlockId('button'),
        type: 'button',
        label: 'New button',
        href: EMAIL_LINKS.recap,
        tone: 'primary',
      };
    } else {
      nextBlock = { id: createBlockId('spacer'), type: 'spacer', size: 'm' };
    }

    setDraft((current) => ({
      ...current,
      blocks: [...current.blocks, nextBlock],
    }));
  }

  function resetDraft() {
    setDraft(createDefaultRecapDraft());
    setNotice({
      tone: 'success',
      message: 'Email draft reset to the seeded recap version.',
    });
  }

  async function handleTestSend() {
    const normalizedEmail = testEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setNotice({ tone: 'error', message: 'Enter a test email before sending.' });
      return;
    }

    setSendingTest(true);
    setNotice(null);

    try {
      const { data, error } = await supabase.functions.invoke<SendBrevoEmailResponse>('send-brevo-email', {
        body: {
          mode: 'test',
          testEmail: normalizedEmail,
          subject: draft.subject,
          previewText: draft.previewText,
          blocks: draft.blocks,
        },
      });

      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || 'Test email failed.');
      }

      setNotice({
        tone: 'success',
        message: `Test email sent to ${normalizedEmail}.`,
      });
      await loadPageData(true);
    } catch (error) {
      console.error('Failed to send test email:', error);
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Failed to send test email.',
      });
    } finally {
      setSendingTest(false);
    }
  }

  async function handleProductionSend() {
    setSendingProduction(true);
    setNotice(null);
    setShowConfirmModal(false);

    try {
      const { data, error } = await supabase.functions.invoke<SendBrevoEmailResponse>('send-brevo-email', {
        body: {
          mode: 'send',
          segment: FIXED_SEGMENT,
          subject: draft.subject,
          previewText: draft.previewText,
          blocks: draft.blocks,
        },
      });

      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || 'Production send failed.');
      }

      setNotice({
        tone: 'success',
        message: `Production email sent to ${data.recipientCount ?? productionCount} subscribers with predictions.`,
      });
      await loadPageData(true);
    } catch (error) {
      console.error('Failed to send production email:', error);
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Failed to send production email.',
      });
    } finally {
      setSendingProduction(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-bears-orange" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Admin Email</p>
            <h1 className="mt-2 text-3xl font-bold text-bears-navy">Email Composer</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Start from the seeded recap draft, tweak copy and image sizing, preview the layout, and then send the exact draft you see here.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadPageData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              Reset Draft
            </button>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-sm ${
                notice.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {notice.tone === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{notice.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">{card.label}</span>
                  <span className="rounded-full bg-slate-100 p-2 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-4 text-3xl font-black tracking-tight text-bears-navy">{card.value}</div>
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Composer Settings</p>
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Subject and preview text</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    These fields are sent along with the draft blocks below.
                  </p>
                </div>
                <Eye className="h-6 w-6 flex-shrink-0 text-bears-orange" />
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
                  <input
                    type="text"
                    value={draft.subject}
                    onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Preview text</label>
                  <textarea
                    value={draft.previewText}
                    onChange={(event) => setDraft((current) => ({ ...current, previewText: event.target.value }))}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Image Library</p>
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Current hosted recap assets</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Paste these into image blocks, or replace them with any public image URL.
                  </p>
                </div>
                <ImageIcon className="h-6 w-6 flex-shrink-0 text-bears-orange" />
              </div>

              <div className="mt-6 grid gap-3">
                {imageLibrary.map((image) => (
                  <div key={image.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">{image.label}</div>
                    <div className="mt-1 break-all text-xs text-slate-500">{image.url}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Blocks</p>
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Edit the draft body</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Rearrange blocks, tweak copy, and control image framing and width without touching raw HTML.
                  </p>
                </div>
                <Type className="h-6 w-6 flex-shrink-0 text-bears-orange" />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <Heading1 className="h-4 w-4" />
                  Add heading
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('paragraph')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <Type className="h-4 w-4" />
                  Add paragraph
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <ImageIcon className="h-4 w-4" />
                  Add image
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('button')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <Plus className="h-4 w-4" />
                  Add button
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('spacer')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <Plus className="h-4 w-4" />
                  Add spacer
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {draft.blocks.map((block, index) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    index={index}
                    total={draft.blocks.length}
                    onChange={(updatedBlock) => updateBlock(block.id, updatedBlock)}
                    onRemove={() => removeBlock(block.id)}
                    onMove={(direction) => moveBlock(block.id, direction)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Send Test</p>
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Send the current draft to yourself</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This sends the exact subject, preview text, images, and block order from the composer above.
                  </p>
                </div>
                <Mail className="h-6 w-6 flex-shrink-0 text-bears-orange" />
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="test-email" className="mb-2 block text-sm font-semibold text-slate-700">
                    Test email
                  </label>
                  <input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(event) => setTestEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-bears-orange focus:ring-2 focus:ring-bears-orange/20"
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">Current subject</div>
                  <div className="mt-1">{draft.subject}</div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleTestSend()}
                  disabled={sendingTest}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-bears-orange px-4 py-3 text-sm font-bold text-white transition hover:bg-bears-orange/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Test Email
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Production Send</p>
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Send this draft to subscribers with predictions</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Production uses the exact draft state from this composer, so send yourself a test first.
                  </p>
                </div>
                <ShieldCheck className="h-6 w-6 flex-shrink-0 text-bears-orange" />
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                <div className="font-semibold">Ready segment</div>
                <div className="mt-1">{productionCount} subscribers with at least one prediction</div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={sendingProduction || productionCount === 0}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-bears-navy px-4 py-3 text-sm font-bold text-white transition hover:bg-bears-navy/95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingProduction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send To Production Segment
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Live Preview</p>
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Email-style layout preview</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This is not a perfect Gmail clone, but it gives you a much faster layout loop before every test send.
                  </p>
                </div>
                <Eye className="h-6 w-6 flex-shrink-0 text-bears-orange" />
              </div>

              <div className="mt-6">
                <ComposerPreview draft={draft} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Recent Sends</p>
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Latest email activity</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Every test and production send is logged so you can confirm what went out and when.
                  </p>
                </div>
                <Mail className="h-6 w-6 flex-shrink-0 text-bears-orange" />
              </div>

              <div className="mt-6 space-y-3">
                {sendLogs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No email sends logged yet.
                  </div>
                ) : (
                  sendLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {log.mode === 'test'
                              ? `Test send to ${log.test_email ?? 'unknown'}`
                              : 'Production send to subscribers with predictions'}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">{log.subject}</div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                            log.status === 'succeeded'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        <span>{log.recipient_count} recipients</span>
                        {log.segment && <span>segment: {log.segment}</span>}
                      </div>

                      {log.error_message && (
                        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            >
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Confirm Send</p>
              <h3 className="mt-2 text-2xl font-bold text-bears-navy">Send this draft to {productionCount} users?</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This will send the exact composer draft to subscribed users who have made at least one prediction.
              </p>

              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Subject</div>
                <div className="mt-1">{draft.subject}</div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleProductionSend()}
                  disabled={sendingProduction}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-bears-orange px-4 py-3 text-sm font-bold text-white transition hover:bg-bears-orange/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingProduction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Confirm Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
