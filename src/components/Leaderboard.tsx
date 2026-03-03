import { useEffect, useState } from 'react';
import { Loader2, Trophy, AlertCircle, Medal, Target } from 'lucide-react';
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
    const fetchLeaderboard = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('get_season_leaderboard', {
          target_season: TARGET_SEASON
        });

        if (rpcError) {
          throw rpcError;
        }

        setRows((data || []) as LeaderboardRow[]);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
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
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-bears-orange" />
            <h1 className="text-3xl font-extrabold tracking-tight text-bears-navy sm:text-4xl">
              2025 Leaderboard
            </h1>
          </div>
          <p className="mt-2 text-base font-medium text-slate-600">
            Ranked by total correct picks. Ties share rank (1, 1, 3).
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fans Ranked</p>
            <p className="mt-1 text-2xl font-extrabold text-bears-navy">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Score</p>
            <p className="mt-1 text-2xl font-extrabold text-bears-navy">{rows[0]?.total_correct ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Season</p>
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
            className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Fan</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Correct Picks</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const accuracy = Number(row.accuracy) || 0;
                    const isTop = row.rank_position === 1;
                    return (
                      <tr key={`${row.display_name}-${index}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-4 text-sm font-bold text-bears-navy">
                          <span className="inline-flex items-center gap-1">
                            {isTop ? <Medal className="h-4 w-4 text-bears-orange" /> : <Target className="h-4 w-4 text-slate-400" />}
                            {row.rank_position}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.display_name}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.total_correct}</td>
                        <td className="px-6 py-4 text-sm text-slate-800">
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
