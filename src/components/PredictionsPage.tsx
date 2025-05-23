import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Trophy, AlertCircle } from 'lucide-react';
import { Navbar } from './Navbar';
import type { Prediction, Game, Question } from '../lib/types';

interface PredictionWithDetails extends Prediction {
  game?: Game;
  question?: {
    text: string;
    category: string;
  };
}

export function PredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('predictions')
          .select(`
            *,
            game:games(*),
            question:questions(
              text,
              category
            )
          `)
          .order('created_at', { ascending: false });

        if (predictionsError) throw predictionsError;
        setPredictions(predictionsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load predictions');
      } finally {
        setLoading(false);
      }
    }

    fetchPredictions();
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-bears-navy">Your Predictions</h1>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
            <Trophy className="w-5 h-5 text-bears-orange" />
            <span className="font-medium">Points: {predictions.reduce((sum, p) => sum + (p.points_earned || 0), 0)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-bears-navy mb-2">
                      {prediction.question?.text || prediction.game?.opponent}
                    </h3>
                    {prediction.game?.date && (
                      <p className="text-gray-600">
                        {new Date(prediction.game.date).toLocaleDateString()}
                      </p>
                    )}
                    {prediction.question?.category && (
                      <p className="text-sm text-gray-500 mt-1">
                        Category: {prediction.question.category}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    prediction.confidence === 'high'
                      ? 'bg-green-100 text-green-800'
                      : prediction.confidence === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} Confidence
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 font-medium">Your Prediction:</p>
                    <p className="text-bears-navy capitalize">{prediction.prediction}</p>
                  </div>

                  {prediction.points_earned !== null && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-gray-600">Points Earned:</span>
                      <span className="font-semibold text-bears-orange">
                        {prediction.points_earned}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {predictions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">You haven't made any predictions yet.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 px-6 py-2 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors"
            >
              Make Your First Prediction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}