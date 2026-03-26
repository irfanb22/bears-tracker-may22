import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCcw, Send, ShieldCheck, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

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

const DEFAULT_SUBJECT = 'How Bears fans predicted the 2025 season';
const FIXED_SEGMENT = 'season_2025_participants';

export function AdminEmailDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<AudienceCounts | null>(null);
  const [sendLogs, setSendLogs] = useState<EmailSendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email ?? '');
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingProduction, setSendingProduction] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
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
      {
        label: 'Subscribed Users',
        value: counts.subscribed_total,
        icon: Users,
      },
      {
        label: 'Subscribed With Predictions',
        value: counts.subscribed_with_predictions,
        icon: ShieldCheck,
      },
      {
        label: 'Unsubscribed',
        value: counts.unsubscribed_total,
        icon: Mail,
      },
      {
        label: 'Send Segment Count',
        value: counts.production_segment_count,
        icon: Send,
      },
    ];
  }, [counts]);

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
            <h1 className="mt-2 text-3xl font-bold text-bears-navy">Email Send Console</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Use this page to send the current coded marketing email to subscribed users with at least one prediction.
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

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Send Test</p>
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Send the current coded email to yourself</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This sends the live template from the edge function. Use it before every production send.
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
                  <div className="mt-1">{DEFAULT_SUBJECT}</div>
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
                  <h2 className="mt-2 text-xl font-bold text-bears-navy">Send to subscribed users with predictions</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This is the live audience for the first marketing campaign. Only users who are still subscribed and have made at least one prediction will receive the email.
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
              <h3 className="mt-2 text-2xl font-bold text-bears-navy">Send this email to {productionCount} users?</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This will send the current coded marketing email to subscribed users who have made at least one prediction.
              </p>

              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Subject</div>
                <div className="mt-1">{DEFAULT_SUBJECT}</div>
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
