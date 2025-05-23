import React, { useState } from 'react';
import { Check, X, Loader2, ArrowRight, AlertCircle, LogIn, XCircle, FolderRoot as Football, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { usePredictions } from '../lib/PredictionContext';
import { formatDistanceToNow, isPast } from 'date-fns';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import type { Question, Choice } from '../lib/PredictionContext';

interface PredictionInterfaceProps {
  selectedCategory?: string;
}

export function PredictionInterface({ selectedCategory = 'all' }: PredictionInterfaceProps) {
  const { user } = useAuth();
  const { 
    questions,
    aggregatedPredictions, 
    userPredictions, 
    loading: predictionsLoading,
    questionAssets,
    error: contextError,
    makePrediction: makeContextPrediction
  } = usePredictions();
  
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<'low' | 'medium' | 'high' | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [successMessages, setSuccessMessages] = useState<Record<string, boolean>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Filter questions based on selected category
  const filteredQuestions = selectedCategory === 'all'
    ? questions
    : questions.filter(q => q.category === selectedCategory);

  if (predictionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-bears-orange" />
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{contextError}</span>
      </div>
    );
  }

  if (!filteredQuestions || filteredQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No questions available for this category.</p>
      </div>
    );
  }

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

  const calculatePercentages = (questionId: string, question: Question) => {
    const data = aggregatedPredictions[questionId];
    if (!data || data.total === 0) {
      if (question.question_type === 'yes_no') {
        return { yes: 0, no: 0 };
      }
      return question.choices?.reduce((acc, choice) => ({
        ...acc,
        [choice.text]: 0
      }), {}) || {};
    }

    if (question.question_type === 'yes_no') {
      return {
        yes: Math.round((data.yes / data.total) * 100),
        no: Math.round((data.no / data.total) * 100)
      };
    }

    return question.choices?.reduce((acc, choice) => ({
      ...acc,
      [choice.text]: Math.round((data[choice.text] / data.total) * 100)
    }), {}) || {};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    
    await handlePrediction();
  };

  const handlePrediction = async () => {
    if (!user || !selectedPrediction || !selectedValue || !selectedConfidence) {
      setError('Please select both a prediction and confidence level');
      return;
    }

    setLoading(prev => ({ ...prev, [selectedPrediction]: true }));
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No active session');
      }

      await makeContextPrediction(selectedPrediction, selectedValue, selectedConfidence);

      setSuccessMessages(prev => ({ ...prev, [selectedPrediction]: true }));
      
      setSelectedPrediction(null);
      setSelectedValue(null);
      setSelectedConfidence(null);

    } catch (err) {
      console.error('Error saving prediction:', err);
      if (err instanceof Error) {
        if (err.message === 'No active session') {
          setShowAuthPrompt(true);
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to save prediction');
      }
    } finally {
      setLoading(prev => ({ ...prev, [selectedPrediction]: false }));
    }
  };

  const handleClose = () => {
    setSelectedPrediction(null);
    setShowAuthPrompt(false);
    setSelectedValue(null);
    setSelectedConfidence(null);
  };

  const renderPredictionOptions = (question: Question) => {
    if (question.question_type === 'yes_no') {
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setSelectedValue('yes')}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
              selectedValue === 'yes'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700'
            }`}
          >
            <Check className="w-5 h-5" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => setSelectedValue('no')}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
              selectedValue === 'no'
                ? 'bg-red-600 text-white'
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
      <div className="space-y-3 mb-6">
        {question.choices?.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => setSelectedValue(choice.text)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
              selectedValue === choice.text
                ? 'bg-bears-navy text-white'
                : 'bg-gray-100 hover:bg-bears-navy/10 text-gray-700'
            }`}
          >
            <span className="font-medium">{choice.text}</span>
            {selectedValue === choice.text && (
              <Check className="w-5 h-5" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const renderPredictionStats = (question: Question) => {
    const percentages = calculatePercentages(question.id, question);
    const isLoading = aggregatedPredictions[question.id]?.loading;

    if (question.question_type === 'yes_no') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-bears-navy">Yes</span>
              <span className="text-sm text-gray-600">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `${percentages.yes}%`
                )}
              </span>
            </div>
            <div className="h-2 bg-bears-navy/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentages.yes}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-bears-navy"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-bears-orange">No</span>
              <span className="text-sm text-gray-600">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `${percentages.no}%`
                )}
              </span>
            </div>
            <div className="h-2 bg-bears-orange/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentages.no}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-bears-orange"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {question.choices?.map((choice) => {
          const percentage = percentages[choice.text] || 0;
          return (
            <div key={choice.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-bears-navy">{choice.text}</span>
                <span className="text-sm text-gray-600">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `${percentage}%`
                  )}
                </span>
              </div>
              <div className="h-2 bg-bears-navy/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-bears-navy"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredQuestions.map((question) => {
          const hasPredicted = userPredictions[question.id];
          const totalVotes = aggregatedPredictions[question.id]?.total || 0;
          const asset = questionAssets[question.id];
          const isExpired = isPast(new Date(question.deadline));
          
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl shadow-sm overflow-hidden border ${
                question.featured
                  ? 'border-bears-orange/20 shadow-bears-orange/10'
                  : 'border-gray-100/50'
              } backdrop-blur-xl`}
              style={{
                background: question.featured
                  ? 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))'
                  : 'rgba(255, 255, 255, 0.9)',
                boxShadow: question.featured
                  ? '0 4px 24px -1px rgba(200, 56, 3, 0.1)'
                  : '0 4px 24px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="p-4 lg:p-5">
                <div className="flex items-start gap-3 lg:gap-4 mb-4 lg:mb-5">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                    {asset?.image ? (
                      <img
                        src={asset.image}
                        alt={question.text}
                        className="w-full h-full object-cover rounded-xl border-2 border-bears-navy/10"
                      />
                    ) : asset?.icon && (
                      <div className="w-full h-full bg-bears-navy/5 flex items-center justify-center">
                        <asset.icon className="w-8 h-8 lg:w-10 lg:h-10 text-bears-navy" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg lg:text-xl font-semibold text-bears-navy">{question.text}</h3>
                    <div className="mt-2 flex flex-col gap-2">
                      {getStatusBadge(question.status, question.deadline)}
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{totalVotes.toLocaleString()} Total Predictions</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Always show prediction stats */}
                  {renderPredictionStats(question)}

                  <button
                    onClick={() => !isExpired && setSelectedPrediction(question.id)}
                    disabled={isExpired}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                      isExpired
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : hasPredicted
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-bears-navy text-white hover:bg-bears-navy/90'
                    }`}
                  >
                    {isExpired ? (
                      <>
                        <Clock className="w-5 h-5" />
                        Prediction Closed
                      </>
                    ) : hasPredicted ? (
                      <>
                        <Check className="w-5 h-5" />
                        Update Prediction
                      </>
                    ) : (
                      <>
                        Make Prediction
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {hasPredicted && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Your prediction:</span>
                        <span className="font-medium text-bears-navy capitalize">
                          {hasPredicted.prediction}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-600">Confidence:</span>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          hasPredicted.confidence === 'high'
                            ? 'bg-green-100 text-green-800'
                            : hasPredicted.confidence === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {hasPredicted.confidence.charAt(0).toUpperCase() + hasPredicted.confidence.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {successMessages[question.id] && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-green-600 text-sm"
                      >
                        Prediction saved successfully!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedPrediction && (
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
              {showAuthPrompt ? (
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto p-6 text-center relative">
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <LogIn className="w-12 h-12 text-bears-orange mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-bears-navy mb-4">
                    Sign In to Make Predictions
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Join the Bears prediction community to save your predictions and compete with other fans!
                  </p>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleClose();
                        setShowLoginModal(true);
                      }}
                      className="w-full py-3 bg-bears-navy text-white rounded-lg hover:bg-bears-navy/90 transition-colors"
                    >
                      Sign In
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleClose();
                        setShowRegisterModal(true);
                      }}
                      className="w-full py-3 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors"
                    >
                      Create Account
                    </motion.button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto relative">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <div className="p-6">
                    {(() => {
                      const question = questions.find(q => q.id === selectedPrediction);
                      if (!question) return null;
                      
                      return (
                        <>
                          <h2 className="text-2xl font-bold text-bears-navy mb-4 pr-8">
                            {question.text}
                          </h2>

                          {renderPredictionOptions(question)}

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
                            disabled={!selectedValue || !selectedConfidence || loading[selectedPrediction]}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading[selectedPrediction] ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                Submit Prediction
                                <ArrowRight className="w-5 h-5" />
                              </>
                            )}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </>
  );
}