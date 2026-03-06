import { useCallback, useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Trophy, Target, Star, Check, X, AlertCircle, Loader2, Settings, Clock, Mail, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';
import { PredictionModal } from './PredictionModal';
import { formatDistanceToNow, isPast } from 'date-fns';

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

interface Stats {
  totalPredictions: number;
  resolvedPredictions: number;
  pendingPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalPoints: number;
}

const normalizePrediction = (value: string | null | undefined) =>
  (value || '').trim().toLowerCase();

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPredictions: 0,
    resolvedPredictions: 0,
    pendingPredictions: 0,
    correctPredictions: 0,
    accuracy: 0,
    totalPoints: 0
  });
  const [predictions, setPredictions] = useState<PredictionWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionWithQuestion | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [nameSavedNotice, setNameSavedNotice] = useState(false);

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
        // Get only the latest prediction for each question
        const latestPredictions = data.reduce((acc: PredictionWithQuestion[], curr) => {
          const existingIndex = acc.findIndex(p => p.question_id === curr.question_id);
          if (existingIndex === -1) {
            acc.push(curr);
          }
          return acc;
        }, []);

        // Score dashboard metrics only for the 2025 season.
        const seasonPredictions = latestPredictions.filter(
          (pred) => pred.questions?.season === 2025
        );

        const resolvedPredictions = seasonPredictions.filter((pred) => {
          const correctAnswer = pred.questions?.correct_answer;
          return !!correctAnswer && correctAnswer.trim().length > 0;
        });

        const correctPredictions = resolvedPredictions.filter((pred) => {
          const correctAnswer = pred.questions?.correct_answer;
          return normalizePrediction(pred.prediction) === normalizePrediction(correctAnswer);
        }).length;

        const totalPredictions = seasonPredictions.length;
        const resolvedCount = resolvedPredictions.length;
        const pendingPredictions = totalPredictions - resolvedCount;
        const accuracy = resolvedCount > 0 ? (correctPredictions / resolvedCount) * 100 : 0;
        const totalPoints = correctPredictions;

        setStats({
          totalPredictions,
          resolvedPredictions: resolvedCount,
          pendingPredictions,
          correctPredictions,
          accuracy,
          totalPoints
        });
        
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
    if (!user?.email) return;
    const localPart = user.email.split('@')[0];
    setDisplayNameDraft(localPart);
  }, [user?.email]);

  const handlePredictionUpdate = async () => {
    await fetchDashboardData();
    setSelectedPrediction(null);
  };

  const getStatusBadge = (status: string, deadline: string) => {
    const isExpired = isPast(new Date(deadline));
    const timeLeft = formatDistanceToNow(new Date(deadline), { addSuffix: true });
    
    switch (status) {
      case 'live':
        return (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Question is Live
            </span>
            {!isExpired && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {timeLeft}
              </span>
            )}
          </div>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            Question is Pending
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
            <span className="w-2 h-2 bg-gray-500 rounded-full" />
            Question is Closed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-bears-orange" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-bears-navy sm:text-4xl">
            My Predictions
          </h1>
          <p className="mt-2 text-base font-medium text-slate-600">
            Track your picks and review your season performance.
          </p>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1.9fr]">
          <aside className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-extrabold text-bears-navy">Profile</h2>
            <div className="mt-3 flex items-start gap-2 text-sm font-medium text-slate-600">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="break-all">{user?.email}</span>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
                Display Name
              </label>
              <input
                type="text"
                value={displayNameDraft}
                onChange={(e) => setDisplayNameDraft(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-bears-orange focus:outline-none focus:ring-1 focus:ring-bears-orange"
              />
              <button
                type="button"
                onClick={() => {
                  setNameSavedNotice(true);
                  setTimeout(() => setNameSavedNotice(false), 1800);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-bears-orange px-3 py-2 text-xs font-bold text-white hover:bg-bears-orange/90"
              >
                <Save className="h-4 w-4" />
                Save Name
              </button>
              {nameSavedNotice && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  Name section is in visual-review mode.
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Resolved</p>
                <p className="mt-1 text-2xl font-extrabold text-bears-navy">{stats.resolvedPredictions}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Accuracy</p>
                <p className="mt-1 text-2xl font-extrabold text-bears-navy">{stats.accuracy.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Points</p>
                <p className="mt-1 text-2xl font-extrabold text-bears-navy">{stats.totalPoints}</p>
              </div>
            </div>
          </aside>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-extrabold text-bears-navy">My Active Picks</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Newest predictions first.</p>

            <div className="mt-4 space-y-3">
              {predictions.map((prediction) => {
                const question = prediction.questions;
                if (!question) return null;

                const isExpired = isPast(new Date(question.deadline));
                const isResolved = !!question.correct_answer && question.correct_answer.trim().length > 0;
                const isCorrect = isResolved && (
                  normalizePrediction(prediction.prediction) === normalizePrediction(question.correct_answer)
                );
                const pointsEarned = isResolved && isCorrect ? 1 : 0;

                return (
                  <article
                    key={prediction.id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">
                          {question.text}
                        </p>
                        <div className="mt-1 text-xs font-medium text-slate-500">
                          Updated {formatDistanceToNow(new Date(prediction.created_at), { addSuffix: true })}
                        </div>
                        <div className="mt-2">{getStatusBadge(question.status, question.deadline)}</div>
                      </div>
                      <span className="whitespace-nowrap rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
                        {prediction.prediction} • {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                      <div className="text-xs font-medium text-slate-600">
                        Points: <span className={pointsEarned > 0 ? 'font-bold text-emerald-700' : 'font-bold text-slate-700'}>{pointsEarned}</span>
                      </div>
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                          <Clock className="h-3.5 w-3.5" />
                          Closed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedPrediction(prediction)}
                          className="inline-flex items-center gap-1 rounded-lg bg-bears-navy px-2.5 py-1.5 text-xs font-bold text-white hover:bg-bears-navy/90"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Update Pick
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {predictions.length === 0 && (
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <Trophy className="mx-auto h-8 w-8 text-slate-400" />
                <h3 className="mt-3 text-lg font-bold text-slate-800">No predictions yet</h3>
                <p className="mt-1 text-sm text-slate-600">Make your first pick to start tracking your results.</p>
              </div>
            )}

            <article className="mt-4 rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">2026 Game-by-Game Picks</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Not started • 17 games to pick</p>
                </div>
                <span className="whitespace-nowrap rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
                  Coming Soon
                </span>
              </div>
            </article>
          </section>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-bears-navy/5 p-2.5">
                <Trophy className="h-5 w-5 text-bears-navy" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Predictions</p>
                <p className="text-2xl font-extrabold text-bears-navy">{stats.totalPredictions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2.5">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resolved</p>
                <p className="text-2xl font-extrabold text-emerald-700">{stats.resolvedPredictions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accuracy</p>
                <p className="text-2xl font-extrabold text-blue-700">{stats.accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2.5">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">2025 Score</p>
                <p className="text-2xl font-extrabold text-amber-700">{stats.totalPoints}</p>
                <p className="text-xs font-semibold text-slate-500">{stats.pendingPredictions} pending</p>
              </div>
            </div>
          </motion.div>
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
