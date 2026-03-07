import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Navbar } from './Navbar';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

interface LeaderboardRow {
  rank_position: number;
  display_name: string;
  total_correct: number;
  resolved_predictions: number;
  accuracy: number | string;
}

const TARGET_SEASON = 2025;

export function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizeDisplayName = (value: unknown, index: number) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
      return `Fan ${index + 1}`;
    };

    const fetchLeaderboard = async (showSpinner = false) => {
      if (showSpinner) {
        setLoading(true);
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_season_leaderboard', {
          target_season: TARGET_SEASON
        });

        if (rpcError) {
          throw rpcError;
        }

        const normalizedRows = ((data || []) as LeaderboardRow[]).map((row, index) => ({
          ...row,
          display_name: normalizeDisplayName(row.display_name, index),
        }));

        setRows(normalizedRows);
        setError(null);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void fetchLeaderboard(false);
      }
    };

    void fetchLeaderboard(true);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-bears-navy sm:text-4xl">
            {TARGET_SEASON} Leaderboard
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Ranked by total correct picks.
          </p>
          <div className="group relative mt-2 inline-block">
            <span
              tabIndex={0}
              className="text-[11px] font-semibold text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700 focus:outline-none"
            >
              How we rank
            </span>
            <div className="pointer-events-none invisible absolute left-0 top-full z-10 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              Ranking uses total correct picks. When tied, fans share the same rank.
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Fans Ranked</p>
            <p className="mt-1 text-2xl font-extrabold text-bears-navy">{rows.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Top Score</p>
            <p className="mt-1 text-2xl font-extrabold text-bears-navy">{rows[0]?.total_correct ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Season</p>
            <p className="mt-1 text-2xl font-extrabold text-bears-navy">{TARGET_SEASON}</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-slate-200 bg-white p-3 sm:p-4"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate [border-spacing:0_8px]">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Rank</th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Fan</th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Correct Picks</th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const accuracy = Number(row.accuracy) || 0;
                    const isTop = row.rank_position === 1;
                    return (
                      <tr key={`${row.display_name}-${index}`} className="text-sm shadow-[0_1px_0_rgba(15,23,42,0.05)]">
                        <td className="rounded-l-lg border border-r-0 border-slate-200 bg-slate-50/40 px-3 py-3 font-bold text-bears-navy">
                          <span className="inline-flex items-center gap-2">
                            {isTop && (
                              <span className="h-1.5 w-1.5 rounded-full bg-bears-orange" />
                            )}
                            {row.rank_position}
                          </span>
                        </td>
                        <td className="border border-l-0 border-r-0 border-slate-200 bg-slate-50/40 px-3 py-3 text-sm font-semibold text-slate-900">{row.display_name}</td>
                        <td className="border border-l-0 border-r-0 border-slate-200 bg-slate-50/40 px-3 py-3 text-sm font-semibold text-slate-900">{row.total_correct}</td>
                        <td className="rounded-r-lg border border-l-0 border-slate-200 bg-slate-50/40 px-3 py-3 text-sm text-slate-800">
                          {accuracy.toFixed(1)}% ({row.total_correct}/{row.resolved_predictions})
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                        No leaderboard data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
