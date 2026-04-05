import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isPast } from 'date-fns';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { PredictionModal } from './PredictionModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { questionAssets } from '../lib/PredictionContext';
import { ANALYTICS_EVENTS, captureEvent } from '../lib/analytics';

interface Question {
  id: string;
  text: string;
  category: string;
  status: 'live' | 'pending' | 'completed';
  deadline: string;
  featured: boolean;
  season: number;
  correct_answer: string | null;
  question_type: 'yes_no' | 'multiple_choice';
  choices?: Choice[];
}

interface Choice {
  id: string;
  text: string;
  prediction_count: number;
}

interface PredictionWithQuestion {
  id: string;
  prediction: string;
  confidence: 'low' | 'medium' | 'high';
  created_at: string;
  question_id: string;
  points_earned: number;
  questions: Question | null;
}

type FilterStatus = 'all' | 'active' | 'resolved' | 'pending';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  qb: 'QB',
  rookies: 'Rookies',
  player_stats: 'Player Stats',
  team_stats: 'Team Stats',
  awards: 'Awards',
  playoffs: 'Playoffs',
  draft_predictions: 'Draft',
};

const CATEGORY_ORDER = ['all', 'qb', 'rookies', 'player_stats', 'team_stats', 'awards', 'playoffs', 'draft_predictions'];
const DASHBOARD_ONBOARDING_TIP_KEY = 'dashboard-onboarding-tip-pending';

const getCategoryLabel = (category: string) => {
  return CATEGORY_LABELS[category] || category.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const getPredictionState = (question: Question | null): Exclude<FilterStatus, 'all'> => {
  if (!question) return 'pending';

  const hasCorrectAnswer = !!question.correct_answer?.trim();
  if (hasCorrectAnswer || question.status === 'completed') {
    return 'resolved';
  }

  if (question.status === 'pending' || isPast(new Date(question.deadline))) {
    return 'pending';
  }

  return 'active';
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [predictions, setPredictions] = useState<PredictionWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionWithQuestion | null>(null);

  const [selectedSeason, setSelectedSeason] = useState<2026 | 2025>(2026);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [displayNameCurrent, setDisplayNameCurrent] = useState('');
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameNotice, setDisplayNameNotice] = useState<string | null>(null);
  const [displayNameNoticeTone, setDisplayNameNoticeTone] = useState<'success' | 'error' | null>(null);
  const [showUsernameHelp, setShowUsernameHelp] = useState(false);
  const [showDashboardTip, setShowDashboardTip] = useState(false);
  const hasTrackedDashboardViewRef = useRef(false);
  const previousFiltersRef = useRef({
    season: selectedSeason,
    category: selectedCategory,
    status: selectedStatus,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('predictions')
        .select(`
          *,
          questions (
            id,
            text,
            category,
            status,
            deadline,
            featured,
            season,
            correct_answer,
            question_type,
            choices (
              id,
              text,
              prediction_count
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const latestPredictions = data.reduce((acc: PredictionWithQuestion[], curr) => {
          const existingIndex = acc.findIndex((item) => item.question_id === curr.question_id);
          if (existingIndex === -1) {
            acc.push(curr);
          }
          return acc;
        }, []);

        setPredictions(latestPredictions);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (loading || hasTrackedDashboardViewRef.current) return;

    captureEvent(ANALYTICS_EVENTS.dashboardViewed, {
      selected_season: selectedSeason,
      prediction_count: predictions.length,
    });
    hasTrackedDashboardViewRef.current = true;
  }, [loading, predictions.length, selectedSeason]);

  useEffect(() => {
    const loadDisplayName = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (!error) {
        const initialName = (data?.display_name || user.email?.split('@')[0] || '').trim();
        setDisplayNameCurrent(initialName);
        setDisplayNameDraft(initialName);
      }
    };

    loadDisplayName();
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowDashboardTip(localStorage.getItem(DASHBOARD_ONBOARDING_TIP_KEY) === 'true');
  }, []);

  const dismissDashboardTip = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DASHBOARD_ONBOARDING_TIP_KEY);
    }
    setShowDashboardTip(false);
  };

  const handlePredictionUpdate = async () => {
    await fetchDashboardData();
    setSelectedPrediction(null);
  };

  useEffect(() => {
    const previous = previousFiltersRef.current;
    if (
      previous.season === selectedSeason &&
      previous.category === selectedCategory &&
      previous.status === selectedStatus
    ) {
      return;
    }
    captureEvent(ANALYTICS_EVENTS.dashboardFilterChanged, {
      season: selectedSeason,
      category: selectedCategory,
      status: selectedStatus,
      previous_season: previous.season,
      previous_category: previous.category,
      previous_status: previous.status,
    });
    previousFiltersRef.current = {
      season: selectedSeason,
      category: selectedCategory,
      status: selectedStatus,
    };
  }, [selectedCategory, selectedSeason, selectedStatus]);

  const handleDisplayNameSave = async () => {
    if (!user) return;

    const trimmedName = displayNameDraft.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setDisplayNameNoticeTone('error');
      setDisplayNameNotice('Username must be between 2 and 50 characters.');
      return;
    }

    try {
      setSavingDisplayName(true);
      setDisplayNameNotice(null);
      setDisplayNameNoticeTone(null);

      const { data: updatedRows, error: updateError } = await supabase
        .from('users')
        .update({ display_name: trimmedName })
        .eq('id', user.id)
        .select('id');

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert(
            {
              id: user.id,
              email: user.email,
              display_name: trimmedName,
            },
            { onConflict: 'id' }
          );

        if (upsertError) throw upsertError;
      }

      setDisplayNameCurrent(trimmedName);
      setDisplayNameDraft(trimmedName);
      setEditingDisplayName(false);
      setDisplayNameNoticeTone('success');
      setDisplayNameNotice('Username updated.');
      captureEvent(ANALYTICS_EVENTS.displayNameSaved);
    } catch (err) {
      console.error('Error updating display name:', err);
      setDisplayNameNoticeTone('error');
      const errorCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      const errorMessage = err instanceof Error ? err.message : '';
      const isDuplicateName =
        errorCode === '23505' || /duplicate key value/i.test(errorMessage);

      if (isDuplicateName) {
        setDisplayNameNotice('That username is already taken. Try another one.');
      } else {
        setDisplayNameNotice('Could not update username right now.');
      }
      captureEvent(ANALYTICS_EVENTS.displayNameSaveFailed, {
        error_type: isDuplicateName ? 'duplicate_name' : 'unknown',
      });
    } finally {
      setSavingDisplayName(false);
    }
  };

  const seasonPredictions = useMemo(() => {
    return predictions.filter((prediction) => prediction.questions?.season === selectedSeason);
  }, [predictions, selectedSeason]);

  const statusFilteredPredictions = useMemo(() => {
    if (selectedStatus === 'all') {
      return seasonPredictions;
    }

    return seasonPredictions.filter((prediction) => getPredictionState(prediction.questions) === selectedStatus);
  }, [seasonPredictions, selectedStatus]);

  const categories = useMemo(() => {
    const detected = Array.from(new Set(seasonPredictions.map((prediction) => prediction.questions?.category).filter(Boolean))) as string[];

    const orderedDetected = detected
      .filter((category) => !CATEGORY_ORDER.includes(category))
      .sort((a, b) => a.localeCompare(b));

    return [...CATEGORY_ORDER, ...orderedDetected];
  }, [seasonPredictions]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: statusFilteredPredictions.length };

    statusFilteredPredictions.forEach((prediction) => {
      const category = prediction.questions?.category;
      if (!category) return;
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [statusFilteredPredictions]);

  const filteredPredictions = useMemo(() => {
    if (selectedCategory === 'all') {
      return statusFilteredPredictions;
    }

    return statusFilteredPredictions.filter((prediction) => prediction.questions?.category === selectedCategory);
  }, [selectedCategory, statusFilteredPredictions]);

  const seasonMetrics = useMemo(() => {
    const totalPicks = seasonPredictions.length;
    const resolvedPredictions = seasonPredictions.filter((prediction) => {
      const question = prediction.questions;
      return !!question?.correct_answer?.trim() || question?.status === 'completed';
    });

    const correctCount = resolvedPredictions.filter((prediction) => {
      const correctAnswer = prediction.questions?.correct_answer?.trim().toLowerCase();
      const userPick = prediction.prediction.trim().toLowerCase();
      return !!correctAnswer && correctAnswer === userPick;
    }).length;

    const accuracy = resolvedPredictions.length > 0
      ? Math.round((correctCount / resolvedPredictions.length) * 1000) / 10
      : 0;

    return {
      totalPicks,
      resolvedCount: resolvedPredictions.length,
      correctCount,
      accuracy,
    };
  }, [seasonPredictions]);

  const canEditPrediction = (prediction: PredictionWithQuestion) => {
    const question = prediction.questions;
    if (!question) return false;

    const state = getPredictionState(question);
    return state === 'active' && !isPast(new Date(question.deadline));
  };

  const statusBadge = (prediction: PredictionWithQuestion) => {
    const state = getPredictionState(prediction.questions);

    if (state === 'active') {
      return <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Active</span>;
    }

    if (state === 'pending') {
      return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">Pending</span>;
    }

    return <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-700">Resolved</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-bears-orange" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="relative">
              <h1 className="text-3xl font-extrabold tracking-tight text-bears-navy sm:text-4xl">My Predictions</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Filter by season, topic, and status. Update active picks from here or on home.
              </p>
              {showDashboardTip && (
                <div className="mt-4 max-w-sm rounded-2xl border border-bears-orange/35 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c2410c]">
                    My Predictions
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    This page is where all your predictions live. Come back here anytime to review or update active picks.
                  </p>
                  <button
                    type="button"
                    onClick={dismissDashboardTip}
                    className="mt-4 rounded-full bg-bears-navy px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>

            <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Username</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-600">
                {displayNameCurrent || user?.email?.split('@')[0] || user?.email}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={displayNameDraft}
                  onChange={(event) => setDisplayNameDraft(event.target.value)}
                  placeholder="Enter username"
                  readOnly={!editingDisplayName}
                  className={`w-full rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    editingDisplayName
                      ? 'border-slate-300 bg-white text-slate-800 focus:border-bears-orange focus:outline-none focus:ring-1 focus:ring-bears-orange'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 opacity-70'
                  }`}
                />
                {!editingDisplayName ? (
                  <button
                    type="button"
                    onClick={() => {
                      captureEvent(ANALYTICS_EVENTS.displayNameEditStarted);
                      setDisplayNameDraft(displayNameCurrent || user?.email?.split('@')[0] || '');
                      setDisplayNameNotice(null);
                      setDisplayNameNoticeTone(null);
                      setEditingDisplayName(true);
                    }}
                    className="rounded-md bg-bears-navy px-3 py-2 text-xs font-bold text-white hover:bg-bears-navy/90"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleDisplayNameSave}
                      disabled={savingDisplayName}
                      className="rounded-md bg-bears-navy px-3 py-2 text-xs font-bold text-white hover:bg-bears-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingDisplayName ? 'Saving' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayNameDraft(displayNameCurrent || user?.email?.split('@')[0] || '');
                        setDisplayNameNotice(null);
                        setDisplayNameNoticeTone(null);
                        setEditingDisplayName(false);
                      }}
                      disabled={savingDisplayName}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
              {displayNameNotice && (
                <p className={`mt-2 text-xs font-semibold ${displayNameNoticeTone === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {displayNameNotice}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowUsernameHelp((previous) => !previous)}
                className="mt-2 text-[11px] font-semibold text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700"
              >
                What's this?
              </button>
              {showUsernameHelp && (
                <p className="mt-1 text-[11px] text-slate-600">
                  This username is shown on the leaderboard instead of your full email.
                </p>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6">
          <div className="inline-flex rounded-full border border-slate-300 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setSelectedSeason(2026)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                selectedSeason === 2026 ? 'bg-bears-navy text-white' : 'text-slate-700'
              }`}
            >
              2026
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeason(2025)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                selectedSeason === 2025 ? 'bg-bears-navy text-white' : 'text-slate-700'
              }`}
            >
              2025
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 lg:h-fit">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Topics</p>
              <div className="mt-3 space-y-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      selectedCategory === category
                        ? 'bg-bears-navy text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{getCategoryLabel(category)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        selectedCategory === category
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {categoryCounts[category] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(['all', 'active', 'pending', 'resolved'] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                      selectedStatus === status
                        ? 'bg-bears-orange text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Showing <span className="font-extrabold text-bears-navy">{filteredPredictions.length}</span> predictions
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total Picks</p>
                <p className="mt-1 text-2xl font-extrabold text-bears-navy">{seasonMetrics.totalPicks}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Accuracy</p>
                <p className="mt-1 text-2xl font-extrabold text-bears-navy">{seasonMetrics.accuracy.toFixed(1)}%</p>
                <p className="text-[11px] font-semibold text-slate-500">
                  {seasonMetrics.correctCount}/{seasonMetrics.resolvedCount} correct
                </p>
              </div>
            </div>

            {selectedSeason === 2026 && selectedCategory === 'all' && (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-700">Game-by-Game Picks: Coming Soon</p>
                <p className="mt-1 text-xs text-slate-500">This section will include all Bears win/loss weekly picks for 2026.</p>
              </div>
            )}

            {filteredPredictions.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-bold text-slate-800">No predictions yet</h3>
                <p className="mt-1 text-sm text-slate-600">Try another season/filter, or make your first pick on Home.</p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="mt-4 rounded-lg bg-bears-navy px-4 py-2 text-sm font-bold text-white hover:bg-bears-navy/90"
                >
                  Go To Home
                </button>
              </div>
            ) : (
              <>
                <div className="mt-5 hidden overflow-x-auto md:block">
                  <table className="min-w-full border-separate [border-spacing:0_10px]">
                    <thead>
                      <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="py-2 pr-3">Question</th>
                        <th className="py-2 pr-3">Topic</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Your Pick</th>
                        <th className="py-2 pr-3">Outcome</th>
                        <th className="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPredictions.map((prediction) => {
                        const question = prediction.questions;
                        if (!question) return null;

                        const editable = canEditPrediction(prediction);
                        const correctAnswer = question.correct_answer?.trim().toLowerCase();
                        const userPrediction = prediction.prediction.trim().toLowerCase();
                        const isResolved = !!correctAnswer;
                        const isCorrect = isResolved && correctAnswer === userPrediction;

                        return (
                          <tr key={prediction.id} className="align-top text-sm shadow-[0_1px_0_rgba(15,23,42,0.05)]">
                            <td className="rounded-l-lg border border-r-0 border-slate-200 bg-slate-50/40 py-3 pl-3 pr-3">
                              <p className="font-semibold text-slate-900">{question.text}</p>
                              <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3.5 w-3.5" />
                                Deadline {new Date(question.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="border border-r-0 border-l-0 border-slate-200 bg-slate-50/40 py-3 pr-3 text-slate-700">{getCategoryLabel(question.category)}</td>
                            <td className="border border-r-0 border-l-0 border-slate-200 bg-slate-50/40 py-3 pr-3">{statusBadge(prediction)}</td>
                            <td className="border border-r-0 border-l-0 border-slate-200 bg-slate-50/40 py-3 pr-3">
                              <p className="font-semibold text-bears-navy">{prediction.prediction}</p>
                              <p className="mt-0.5 text-xs font-medium capitalize text-slate-500">
                                {prediction.confidence} confidence
                              </p>
                            </td>
                            <td className="border border-r-0 border-l-0 border-slate-200 bg-slate-50/40 py-3 pr-3">
                              {question.correct_answer?.trim() ? (
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    isCorrect
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-500">-</span>
                              )}
                            </td>
                            <td className="rounded-r-lg border border-l-0 border-slate-200 bg-slate-50/40 py-3 pr-3">
                              {editable ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    captureEvent(ANALYTICS_EVENTS.dashboardPredictionOpened, {
                                      question_id: prediction.question_id,
                                      season: prediction.questions?.season,
                                      category: prediction.questions?.category,
                                      prediction_state: getPredictionState(prediction.questions),
                                    });
                                    setSelectedPrediction(prediction);
                                  }}
                                  className="rounded-md bg-bears-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-bears-navy/90"
                                >
                                  Edit
                                </button>
                              ) : (
                                <span className="text-xs font-semibold text-slate-500">Locked</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white md:hidden">
                  {filteredPredictions.map((prediction) => {
                    const question = prediction.questions;
                    if (!question) return null;
                    const asset = questionAssets[question.id];

                    const editable = canEditPrediction(prediction);
                    const correctAnswer = question.correct_answer?.trim().toLowerCase();
                    const userPrediction = prediction.prediction.trim().toLowerCase();
                    const isResolved = !!correctAnswer;
                    const isCorrect = isResolved && correctAnswer === userPrediction;

                    return (
                      <article key={prediction.id} className="border-b border-slate-200 px-3 py-3 last:border-b-0">
                        <div className="flex items-center justify-between gap-2">
                          {statusBadge(prediction)}
                          <span className="text-xs font-semibold text-slate-500">{getCategoryLabel(question.category)}</span>
                        </div>

                        <div className="mt-2 flex items-start gap-2.5">
                          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {asset?.image ? (
                              <img src={asset.image} alt={question.text} className="h-full w-full object-cover" />
                            ) : asset?.icon ? (
                              <div className="flex h-full w-full items-center justify-center bg-bears-navy/5">
                                <asset.icon className="h-5 w-5 text-bears-navy" />
                              </div>
                            ) : null}
                          </div>
                          <p className="text-sm font-bold leading-snug text-slate-900">
                            {question.text}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Deadline {new Date(question.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>

                        <div className="mt-2 flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-bears-navy">
                            Your Pick: {prediction.prediction}{' '}
                            <span className="text-xs font-medium capitalize text-slate-500">({prediction.confidence})</span>
                          </p>
                          {question.correct_answer?.trim() ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                isCorrect
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">-</span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-end">
                          {editable ? (
                            <button
                              type="button"
                              onClick={() => {
                                captureEvent(ANALYTICS_EVENTS.dashboardPredictionOpened, {
                                  question_id: prediction.question_id,
                                  season: prediction.questions?.season,
                                  category: prediction.questions?.category,
                                  prediction_state: getPredictionState(prediction.questions),
                                });
                                setSelectedPrediction(prediction);
                              }}
                              className="rounded-md bg-bears-navy px-3 py-1.5 text-xs font-bold text-white"
                            >
                              Edit
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">Locked</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </main>
        </div>

        <PredictionModal
          isOpen={!!selectedPrediction}
          onClose={() => setSelectedPrediction(null)}
          onPredictionUpdate={handlePredictionUpdate}
          prediction={selectedPrediction}
        />
      </div>
    </div>
  );
}
