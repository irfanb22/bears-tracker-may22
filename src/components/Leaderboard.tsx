import React, { useEffect, useState } from 'react';
import { Loader2, Trophy, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-bears-orange" />
            <h1 className="text-3xl font-bold text-bears-navy">2025 Leaderboard</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Ranked by total correct picks. Ties share rank (1, 1, 3).
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Correct Picks</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const accuracy = Number(row.accuracy) || 0;
                    return (
                      <tr key={`${row.display_name}-${index}`} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-6 py-4 text-sm font-bold text-bears-navy">{row.rank_position}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{row.display_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{row.total_correct}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {accuracy.toFixed(1)}% ({row.total_correct}/{row.resolved_predictions})
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
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
