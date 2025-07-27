import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface GameForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Game {
  id: string;
  opponent: string;
  location: string;
  date: string;
}

interface Predictions {
  [gameId: string]: 'win' | 'loss' | null;
}

export function GameForecastModal({ isOpen, onClose }: GameForecastModalProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Predictions>({});
  const [loadingGames, setLoadingGames] = useState(false);
  const [errorGames, setErrorGames] = useState<string | null>(null);
  const [savingPredictions, setSavingPredictions] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch games when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGames();
    } else {
      // Reset state when modal closes
      setGames([]);
      setPredictions({});
      setErrorGames(null);
      setSaveError(null);
    }
  }, [isOpen]);

  const fetchGames = async () => {
    setLoadingGames(true);
    setErrorGames(null);

    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, opponent, date, location')
        .order('date', { ascending: true });

      if (error) throw error;

      setGames(data || []);
      
      // Initialize predictions state for all games
      const initialPredictions: Predictions = {};
      (data || []).forEach(game => {
        initialPredictions[game.id] = null;
      });
      setPredictions(initialPredictions);

    } catch (err) {
      console.error('Error fetching games:', err);
      setErrorGames(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoadingGames(false);
    }
  };

  const handlePrediction = (gameId: string, prediction: 'win' | 'loss') => {
    setPredictions(prev => ({
      ...prev,
      [gameId]: prev[gameId] === prediction ? null : prediction
    }));
  };

  const handleSavePredictions = async () => {
    if (!user) {
      setSaveError('You must be logged in to save predictions');
      return;
    }

    setSavingPredictions(true);
    setSaveError(null);

    try {
      // Prepare predictions for database insertion
      const predictionInserts = Object.entries(predictions)
        .filter(([_, prediction]) => prediction !== null)
        .map(([gameId, prediction]) => ({
          user_id: user.id,
          game_id: gameId,
          prediction: prediction as string,
          confidence: 'medium' as const,
          prediction_type_id: 'd290f1ee-6c54-4b01-90e6-d701748f0852' // Game prediction type
        }));

      if (predictionInserts.length === 0) {
        setSaveError('Please make at least one prediction before saving');
        return;
      }

      // Save predictions to database
      const { error } = await supabase
        .from('predictions')
        .upsert(predictionInserts, {
          onConflict: 'user_id,game_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      // Close modal on success
      onClose();

    } catch (err) {
      console.error('Error saving predictions:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save predictions');
    } finally {
      setSavingPredictions(false);
    }
  };

  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric'
    });
  };

  const getWeekNumber = (index: number) => index + 1;

  const predictedGames = Object.values(predictions).filter(p => p !== null).length;
  const totalGames = games.length;
  const allGamesPredicted = predictedGames === totalGames;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-bears-navy">
                  2025 Season Predictions
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <p className="text-gray-600 mb-6">
                  Make your win/loss predictions for each Bears game this season.
                </p>

                {loadingGames ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-bears-orange" />
                    <span className="ml-2 text-gray-600">Loading games...</span>
                  </div>
                ) : errorGames ? (
                  <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{errorGames}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {games.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center">
                              <span className="text-sm font-bold text-bears-navy bg-bears-navy/10 px-2 py-1 rounded">
                                WK {getWeekNumber(index)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-bears-navy">
                                {game.location.toLowerCase() === 'home' ? 'vs' : '@'} {game.opponent}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatGameDate(game.date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span className="capitalize">{game.location}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Prediction buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handlePrediction(game.id, 'win')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all duration-200 font-medium border-2 ${
                              predictions[game.id] === 'win'
                                ? 'bg-bears-navy text-white border-bears-navy'
                                : 'bg-white text-bears-navy border-bears-navy hover:bg-bears-navy hover:text-white'
                            }`}
                          >
                            🐻 Win
                          </button>
                          <button
                            onClick={() => handlePrediction(game.id, 'loss')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all duration-200 font-medium border-2 ${
                              predictions[game.id] === 'loss'
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white text-red-500 border-red-500 hover:bg-red-500 hover:text-white'
                            }`}
                          >
                            <span className="drop-shadow-sm">❌</span> Loss
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {saveError && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg mt-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onClose}
                    disabled={savingPredictions}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePredictions}
                    disabled={savingPredictions || loadingGames || !!errorGames}
                    className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                      savingPredictions || loadingGames || !!errorGames
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-bears-orange text-white hover:bg-bears-orange/90'
                    }`}
                  >
                    {savingPredictions ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Predictions'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}