import React, { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Trophy, Target, Star, Check, X, AlertCircle, Loader2, ArrowRight, User, Settings, Clock, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { PredictionModal } from './PredictionModal';
import { questionAssets } from '../lib/PredictionContext';
import { formatDistanceToNow, isPast } from 'date-fns';

interface Question {
  id: string;
  text: string;
  category: string;
  status: 'live' | 'pending' | 'completed';
  deadline: string;
  featured: boolean;
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
  correctPredictions: number;
  upcomingPredictions: number;
  totalPoints: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPredictions: 0,
    correctPredictions: 0,
    upcomingPredictions: 0,
    totalPoints: 0
  });
  const [predictions, setPredictions] = useState<PredictionWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionWithQuestion | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [editDisplayNameError, setEditDisplayNameError] = useState<string | null>(null);
  const [editDisplayNameSuccess, setEditDisplayNameSuccess] = useState<string | null>(null);
  const [originalDisplayName, setOriginalDisplayName] = useState<string>('');
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  const fetchDashboardData = async () => {
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
        
        // Calculate total points
        const totalPoints = latestPredictions.reduce((sum, pred) => sum + (pred.points_earned || 0), 0);
        
        setStats({
          totalPredictions: latestPredictions.length,
          correctPredictions: 0,
          upcomingPredictions: latestPredictions.length,
          totalPoints: totalPoints
        });
        
        setPredictions(latestPredictions);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDisplayName = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const name = data?.display_name || '';
      setDisplayName(name);
      setOriginalDisplayName(name);
    } catch (err) {
      console.error('Error fetching user display name:', err);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!user) return;

    const trimmedName = displayName.trim();
    
    // Client-side validation
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setEditDisplayNameError('Display name must be between 2 and 50 characters');
      return;
    }

    setSavingDisplayName(true);
    setEditDisplayNameError(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: trimmedName })
        .eq('id', user.id);

      if (error) throw error;

      setOriginalDisplayName(trimmedName);
      setDisplayName(trimmedName);
      setIsEditingDisplayName(false);
      setEditDisplayNameSuccess('Display name updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setEditDisplayNameSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating display name:', err);
      setEditDisplayNameError(err instanceof Error ? err.message : 'Failed to update display name');
    } finally {
      setSavingDisplayName(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(originalDisplayName);
    setEditDisplayNameError(null);
    setEditDisplayNameSuccess(null);
    setIsEditingDisplayName(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    fetchUserDisplayName();
  }, [user]);

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-bears-navy">Your Prediction Dashboard</h1>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                <User className="w-5 h-5" />
                <span>{user?.email}</span>
              </div>
              
              {/* Display Name Section */}
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm min-w-[200px]">
                {!isEditingDisplayName ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Display Name</span>
                      <span className="text-sm font-medium text-gray-700">
                        {displayName || 'Set your display name'}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsEditingDisplayName(true)}
                      className="p-1 text-gray-400 hover:text-bears-navy transition-colors"
                      title="Edit display name"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-bears-orange focus:border-bears-orange"
                      placeholder="Enter display name"
                      maxLength={50}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveDisplayName}
                        disabled={savingDisplayName}
                        className="flex items-center gap-1 px-2 py-1 bg-bears-orange text-white text-xs rounded hover:bg-bears-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingDisplayName ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingDisplayName}
                        className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2 text-gray-600">Track your predictions and performance</p>
        </div>

        {/* Success/Error Messages for Display Name */}
        <AnimatePresence>
          {editDisplayNameSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700">{editDisplayNameSuccess}</p>
            </motion.div>
          )}

          {editDisplayNameError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{editDisplayNameError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl shadow-sm p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-bears-navy/5 rounded-lg">
                <Trophy className="w-6 h-6 text-bears-navy" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Predictions</p>
                <p className="text-2xl font-bold text-bears-navy">{stats.totalPredictions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl shadow-sm p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Predictions</p>
                <p className="text-2xl font-bold text-green-600">{stats.upcomingPredictions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl shadow-sm p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">2025 Season Score</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {predictions.map((prediction) => {
            const question = prediction.questions;
            if (!question) return null;
            
            const asset = questionAssets[prediction.question_id];
            const isMultipleChoice = question.question_type === 'multiple_choice';
            const isExpired = isPast(new Date(question.deadline));
            
            return (
              <motion.div
                key={prediction.id}
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
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Your prediction:</span>
                      {isMultipleChoice ? (
                        <span className="font-medium text-bears-navy">
                          {prediction.prediction}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {prediction.prediction.toLowerCase() === 'yes' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium text-gray-700">
                            {prediction.prediction}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        prediction.confidence === 'high'
                          ? 'bg-green-100 text-green-800'
                          : prediction.confidence === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-gray-600">Points earned:</span>
                      <span className={`font-medium ${
                        prediction.points_earned > 0 ? 'text-green-600' : 
                        prediction.points_earned < 0 ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {prediction.points_earned || 0}
                      </span>
                    </div>

                    {isExpired ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 p-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                      >
                        <Clock className="w-5 h-5" />
                        Prediction Closed
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedPrediction(prediction)}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-bears-navy text-white rounded-lg hover:bg-bears-navy/90 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        Update Prediction
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {predictions.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No predictions yet</h3>
              <p className="text-gray-500 mb-6">Start making predictions to track your performance</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors"
              >
                Make Your First Prediction
                <ArrowRight className="ml-2 w-5 h-5" />
              </motion.button>
            </div>
          )}
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