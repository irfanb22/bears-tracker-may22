import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { PredictionEditorModal } from './PredictionEditorModal';

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPredictionUpdate: () => void;
  prediction?: {
    question_id: string;
    prediction: string;
    confidence: 'low' | 'medium' | 'high';
    questions?: {
      id?: string;
      text: string;
      status?: 'live' | 'pending' | 'completed';
      question_type: 'yes_no' | 'multiple_choice';
      deadline: string;
      correct_answer?: string | null;
      choices?: {
        id: string;
        text: string;
      }[];
    } | null;
  } | null;
}

export function PredictionModal({ isOpen, onClose, onPredictionUpdate, prediction }: PredictionModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPreviewMode = prediction?.question_id?.startsWith('preview-') ?? false;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSave = async (selectedValue: string, selectedConfidence: 'low' | 'medium' | 'high') => {
    if (!user || !prediction) return;

    if (isPreviewMode) {
      handleClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('predictions')
        .upsert(
          {
            user_id: user.id,
            question_id: prediction.question_id,
            prediction: selectedValue,
            confidence: selectedConfidence,
            points_earned: 0,
            prediction_type_id: 'd290f1ee-6c54-4b01-90e6-d701748f0852',
            created_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false,
          }
        );

      if (updateError) throw updateError;

      onPredictionUpdate();
      handleClose();
    } catch (err) {
      console.error('Error updating prediction:', err);
      setError(err instanceof Error ? err.message : 'Failed to update prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PredictionEditorModal
      isOpen={isOpen}
      question={
        prediction?.questions
          ? {
              id: prediction.questions.id ?? prediction.question_id,
              text: prediction.questions.text,
              deadline: prediction.questions.deadline,
              status: prediction.questions.status,
              question_type: prediction.questions.question_type,
              choices: prediction.questions.choices,
              correct_answer: prediction.questions.correct_answer ?? null,
            }
          : null
      }
      initialValue={prediction?.prediction ?? null}
      initialConfidence={prediction?.confidence ?? null}
      userPrediction={
        prediction
          ? {
              prediction: prediction.prediction,
              confidence: prediction.confidence,
            }
          : null
      }
      error={error}
      loading={loading}
      onClose={handleClose}
      onSave={handleSave}
      submitLabel={isPreviewMode ? 'Preview Complete' : 'Update Prediction'}
    />
  );
}
