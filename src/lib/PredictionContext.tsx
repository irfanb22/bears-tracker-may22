import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useAuth } from './auth';

// Import player images and icons
import calebImage from '../assets/WillCa03_2024.jpg';
import sweatImage from '../assets/SweaMo00_2024.jpg';
import odunzeImage from '../assets/OdunRo00_2024.jpg';
import thuneyImage from '../assets/joe.jpg';
import benJohnsonImage from '../assets/ben_johnson.jpg';
import bearsLogo from '../assets/bears logo.png';
import draftLogo from '../assets/NFL_Draft_logo.jpg';
import briskerImage from '../assets/brisker.png';
import { FolderRoot as Football } from 'lucide-react';

export interface Question {
  id: string;
  text: string;
  category: string;
  status: 'live' | 'pending' | 'completed';
  deadline: string;
  featured: boolean;
  question_type: 'yes_no' | 'multiple_choice';
  choices?: Choice[];
}

export interface Choice {
  id: string;
  text: string;
  prediction_count: number;
}

export interface Prediction {
  id: string;
  user_id: string;
  question_id: string;
  prediction: string;
  confidence: 'low' | 'medium' | 'high';
  created_at: string;
  questions?: {
    text: string;
    category: string;
  };
}

interface PredictionStats {
  totalPredictions: number;
  upcomingPredictions: number;
}

interface AggregatedPredictions {
  [questionId: string]: {
    [choice: string]: number;
    total: number;
    loading: boolean;
  };
}

interface UserPredictions {
  [questionId: string]: {
    id: string;
    prediction: string;
    confidence: 'low' | 'medium' | 'high';
  };
}

interface PredictionContextType {
  predictions: Prediction[];
  questions: Question[];
  stats: PredictionStats;
  loading: boolean;
  error: string | null;
  recentlyAdded: Set<string>;
  questionAssets: Record<string, { image?: string; icon?: React.ElementType }>;
  aggregatedPredictions: AggregatedPredictions;
  userPredictions: UserPredictions;
  fetchPredictions: () => Promise<void>;
  makePrediction: (questionId: string, prediction: string, confidence: 'low' | 'medium' | 'high') => Promise<void>;
  clearError: () => void;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

// Map of question IDs to their corresponding images or icons
export const questionAssets: Record<string, { image?: string; icon?: React.ElementType }> = {
  '550e8400-e29b-41d4-a716-446655440000': { image: calebImage },
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8': { image: sweatImage },
  '6ba7b811-9dad-11d1-80b4-00c04fd430c8': { image: bearsLogo }, // Bears wins
  '6ba7b812-9dad-11d1-80b4-00c04fd430c8': { image: thuneyImage },
  '6ba7b813-9dad-11d1-80b4-00c04fd430c8': { image: odunzeImage },
  '6ba7b814-9dad-11d1-80b4-00c04fd430c8': { image: bearsLogo }, // Bears playoffs
  '85da49f8-bcac-4a7c-a30d-81fa73d06202': { image: benJohnsonImage }, // Ben Johnson Coach of the Year
  '7ba7b814-9dad-11d1-80b4-00c04fd430c8': { image: draftLogo }, // Draft question
  'da0b27ee-0b65-401a-a473-092631a19efb': { image: bearsLogo }, // Bears top-10 offense
  'ace92d81-b9d4-48ed-b2ab-ef3390ed0840': { image: bearsLogo }, // Bears top-10 defense
  '2ca00c0b-147f-4fd0-bc95-6d989ed11ac4': { image: briskerImage }, // Brisker question
};

const calculateAggregates = (data: any[] | null, questions: Question[]): AggregatedPredictions => {
  const aggregates: AggregatedPredictions = {};

  // Initialize aggregates for all questions
  questions.forEach(question => {
    if (question.question_type === 'yes_no') {
      aggregates[question.id] = { yes: 0, no: 0, total: 0, loading: false };
    } else if (question.choices) {
      const choiceCounts = question.choices.reduce((acc, choice) => ({
        ...acc,
        [choice.text]: 0
      }), {});
      aggregates[question.id] = { ...choiceCounts, total: 0, loading: false };
    }
  });

  // Process prediction data
  if (data && Array.isArray(data)) {
    data.forEach(prediction => {
      const { question_id, prediction: vote } = prediction;
      const question = questions.find(q => q.id === question_id);
      
      if (question && aggregates[question_id]) {
        if (question.question_type === 'yes_no') {
          const normalizedVote = vote.toLowerCase();
          if (aggregates[question_id][normalizedVote] !== undefined) {
            aggregates[question_id][normalizedVote]++;
            aggregates[question_id].total++;
          }
        } else if (question.choices) {
          // For multiple choice, use the exact prediction text
          if (aggregates[question_id][vote] !== undefined) {
            aggregates[question_id][vote]++;
            aggregates[question_id].total++;
          }
        }
      }
    });
  }

  return aggregates;
};

export function PredictionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<PredictionStats>({
    totalPredictions: 0,
    upcomingPredictions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [aggregatedPredictions, setAggregatedPredictions] = useState<AggregatedPredictions>({});
  const [userPredictions, setUserPredictions] = useState<UserPredictions>({});

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('questions')
        .select(`
          *,
          choices (
            id,
            text,
            prediction_count
          )
        `)
        .order('featured', { ascending: false })
        .order('deadline', { ascending: true });

      if (fetchError) throw fetchError;
      setQuestions(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching questions:', err);
      throw err;
    }
  }, []);

  const fetchAggregatedPredictions = useCallback(async (currentQuestions: Question[]) => {
    try {
      // Set loading state for all questions
      setAggregatedPredictions(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(questionId => {
          updated[questionId] = { ...updated[questionId], loading: true };
        });
        return updated;
      });

      // Fetch all predictions without any user filtering
      const { data, error } = await supabase
        .from('predictions')
        .select('question_id, prediction');

      // Don't throw JWT errors for anonymous users
      if (error && !error.message.includes('JWT')) {
        throw error;
      }

      // Calculate aggregates from raw prediction data
      const aggregates = calculateAggregates(data || [], currentQuestions);
      setAggregatedPredictions(aggregates);
    } catch (err) {
      console.error('Error fetching aggregated predictions:', err);
      throw err;
    }
  }, []);

  const fetchUserPredictions = useCallback(async () => {
    if (!user) {
      setUserPredictions({});
      setPredictions([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('predictions')
        .select(`
          *,
          questions (
            text,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get only the latest prediction for each question
      const latestPredictions = data?.reduce((acc: Prediction[], curr) => {
        const existingIndex = acc.findIndex(p => p.question_id === curr.question_id);
        if (existingIndex === -1) {
          acc.push(curr);
        }
        return acc;
      }, []) || [];

      // Create user predictions map
      const userPredictionsMap: UserPredictions = {};
      latestPredictions.forEach((prediction) => {
        userPredictionsMap[prediction.question_id] = {
          id: prediction.id,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
        };
      });

      setPredictions(latestPredictions);
      setUserPredictions(userPredictionsMap);
      setStats(calculateStats(latestPredictions));
    } catch (err) {
      console.error('Error fetching user predictions:', err);
      throw err;
    }
  }, [user]);

  const calculateStats = useCallback((predictions: Prediction[]) => ({
    totalPredictions: predictions.length,
    upcomingPredictions: predictions.length,
  }), []);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch questions first
      const currentQuestions = await fetchQuestions();

      // Fetch aggregated predictions and user predictions in parallel
      await Promise.all([
        fetchAggregatedPredictions(currentQuestions),
        fetchUserPredictions()
      ]);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchQuestions, fetchAggregatedPredictions, fetchUserPredictions]);

  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel('predictions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions'
        },
        async () => {
          // Always refresh aggregated counts
          const currentQuestions = await fetchQuestions();
          await fetchAggregatedPredictions(currentQuestions);
          
          // Only refresh user predictions if authenticated
          if (user) {
            await fetchUserPredictions();
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      channel.unsubscribe();
    };
  }, [fetchQuestions, fetchAggregatedPredictions, fetchUserPredictions, user]);

  const makePrediction = useCallback(async (questionId: string, prediction: string, confidence: 'low' | 'medium' | 'high') => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if the question's deadline has passed
      const question = questions.find(q => q.id === questionId);
      if (!question) throw new Error('Question not found');

      const deadline = new Date(question.deadline);
      if (deadline < new Date()) {
        throw new Error('The deadline for this prediction has passed');
      }

      const { data, error } = await supabase
        .from('predictions')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          prediction,
          confidence,
          prediction_type_id: 'd290f1ee-6c54-4b01-90e6-d701748f0852'
        }, {
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      // Add to recently added set
      setRecentlyAdded(prev => new Set(prev).add(data.id));
      
      // Remove from recently added after animation
      setTimeout(() => {
        setRecentlyAdded(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.id);
          return newSet;
        });
      }, 5000);

      // Update user predictions immediately
      setUserPredictions(prev => ({
        ...prev,
        [questionId]: {
          id: data.id,
          prediction,
          confidence,
        }
      }));

      // Fetch updated predictions and aggregates
      await fetchPredictions();
    } catch (err) {
      console.error('Error making prediction:', err);
      throw err;
    }
  }, [user, questions, fetchPredictions]);

  useEffect(() => {
    fetchPredictions();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [user, fetchPredictions, setupRealtimeSubscription]);

  const clearError = () => setError(null);

  return (
    <PredictionContext.Provider
      value={{
        predictions,
        questions,
        stats,
        loading,
        error,
        recentlyAdded,
        questionAssets,
        aggregatedPredictions,
        userPredictions,
        fetchPredictions,
        makePrediction,
        clearError,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
}

export function usePredictions() {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('usePredictions must be used within a PredictionProvider');
  }
  return context;
}