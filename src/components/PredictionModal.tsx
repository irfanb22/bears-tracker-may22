import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { isPast } from 'date-fns';

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPredictionUpdate: () => void;
  prediction?: {
    question_id: string;
    prediction: string;
    confidence: 'low' | 'medium' | 'high';
    questions?: {
      text: string;
      question_type: 'yes_no' | 'multiple_choice';
      deadline: string;
      choices?: {
        id: string;
        text: string;
      }[];
    } | null;
  } | null;
}

export function PredictionModal({ isOpen, onClose, onPredictionUpdate, prediction }: PredictionModalProps) {
  const { user } = useAuth();
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpired = prediction?.questions?.deadline ? isPast(new Date(prediction.questions.deadline)) : false;

  // Update state when prediction changes
  useEffect(() => {
    if (prediction) {
      setSelectedValue(prediction.prediction);
      setSelectedConfidence(prediction.confidence);
    } else {
      setSelectedValue(null);
      setSelectedConfidence('medium');
    }
  }, [prediction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !prediction || !selectedValue || isExpired) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('predictions')
        .upsert({
          user_id: user.id,
          question_id: prediction.question_id,
          prediction: selectedValue,
          confidence: selectedConfidence,
          points_earned: 0,
          prediction_type_id: 'd290f1ee-6c54-4b01-90e6-d701748f0852',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false
        });

      if (updateError) throw updateError;

      onPredictionUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating prediction:', err);
      setError(err instanceof Error ? err.message : 'Failed to update prediction');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setError(null);
    onClose();
  };

  const renderPredictionOptions = () => {
    if (!prediction?.questions) return null;

    if (prediction.questions.question_type === 'yes_no') {
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            disabled={isExpired}
            onClick={() => setSelectedValue('yes')}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
              selectedValue === 'yes'
                ? 'bg-green-600 text-white'
                : isExpired
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700'
            }`}
          >
            <Check className="w-5 h-5" />
            Yes
          </button>
          <button
            type="button"
            disabled={isExpired}
            onClick={() => setSelectedValue('no')}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
              selectedValue === 'no'
                ? 'bg-red-600 text-white'
                : isExpired
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700'
            }`}
          >
            <X className="w-5 h-5" />
            No
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
        {prediction.questions.choices?.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={isExpired}
            onClick={() => setSelectedValue(choice.text)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors text-left ${
              selectedValue === choice.text
                ? 'bg-bears-navy text-white'
                : isExpired
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-bears-navy/10 text-gray-700'
            }`}
          >
            <span className="font-medium flex-1 mr-4">{choice.text}</span>
            {selectedValue === choice.text && (
              <Check className="w-5 h-5 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto relative">
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-bears-navy mb-6 pr-8">
                  {prediction?.questions?.text}
                </h2>

                {isExpired ? (
                  <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 text-gray-500 rounded-lg mb-6">
                    <Clock className="w-5 h-5" />
                    <span>Prediction Closed</span>
                  </div>
                ) : (
                  <>
                    {renderPredictionOptions()}

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How confident are you?
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setSelectedConfidence(level)}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedConfidence === level
                                ? 'bg-bears-navy text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-bears-navy/10'
                            }`}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedValue || loading}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Update Prediction'
                      )}
                    </button>
                  </>
                )}
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}