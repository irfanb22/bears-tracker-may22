import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar } from 'lucide-react';

interface GameForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Game {
  week: number;
  opponent: string;
  location: 'Home' | 'Away';
  date: string;
}

const dummyGames: Game[] = [
  { week: 1, opponent: 'Minnesota Vikings', location: 'Away', date: 'Mon 9/9' },
  { week: 2, opponent: 'Detroit Lions', location: 'Away', date: 'Sun 9/14' },
  { week: 3, opponent: 'Dallas Cowboys', location: 'Home', date: 'Sun 9/21' },
  { week: 4, opponent: 'Las Vegas Raiders', location: 'Home', date: 'Sun 9/28' },
];

export function GameForecastModal({ isOpen, onClose }: GameForecastModalProps) {
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

                <div className="space-y-4">
                  {dummyGames.map((game) => (
                    <motion.div
                      key={game.week}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: game.week * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-bears-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {game.week}
                          </div>
                          <div>
                            <h3 className="font-semibold text-bears-navy">
                              {game.location === 'Home' ? 'vs' : '@'} {game.opponent}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{game.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{game.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Prediction buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors font-medium">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Win
                        </button>
                        <button className="flex items-center justify-center gap-2 p-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium">
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                          Loss
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 px-4 py-3 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors font-medium">
                    Save Predictions
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