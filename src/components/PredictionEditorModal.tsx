import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Loader2 } from 'lucide-react';
import { isPast } from 'date-fns';

type ConfidenceLevel = 'low' | 'medium' | 'high';

interface EditorChoice {
  id: string;
  text: string;
}

interface EditorQuestion {
  id: string;
  text: string;
  deadline: string;
  status?: 'live' | 'pending' | 'completed';
  question_type: 'yes_no' | 'multiple_choice';
  choices?: EditorChoice[];
  correct_answer?: string | null;
}

interface PredictionEditorModalProps {
  isOpen: boolean;
  question: EditorQuestion | null;
  initialValue: string | null;
  initialConfidence: ConfidenceLevel | null;
  userPrediction?: { prediction: string; confidence: ConfidenceLevel } | null;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onSave: (prediction: string, confidence: ConfidenceLevel) => Promise<void>;
  submitLabel?: string;
}

export function PredictionEditorModal({
  isOpen,
  question,
  initialValue,
  initialConfidence,
  userPrediction,
  error,
  loading,
  onClose,
  onSave,
  submitLabel = 'Submit Prediction',
}: PredictionEditorModalProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedValue(initialValue);
    setSelectedConfidence(initialConfidence);
  }, [isOpen, initialValue, initialConfidence]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const hasDeadlinePassed = question?.deadline ? isPast(new Date(question.deadline)) : false;
  const isLocked = !!question && (question.status === 'completed' || hasDeadlinePassed);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!question || !selectedValue || !selectedConfidence || isLocked) return;
    await onSave(selectedValue, selectedConfidence);
  };

  const renderOptions = () => {
    if (!question) return null;

    if (question.question_type === 'yes_no') {
      return (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isLocked}
            onClick={() => setSelectedValue('yes')}
            className={`flex items-center justify-center rounded-xl border px-3 py-2 text-[13px] font-bold transition-colors ${
              selectedValue === 'yes'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : isLocked
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            disabled={isLocked}
            onClick={() => setSelectedValue('no')}
            className={`flex items-center justify-center rounded-xl border px-3 py-2 text-[13px] font-bold transition-colors ${
              selectedValue === 'no'
                ? 'border-red-600 bg-red-50 text-red-700'
                : isLocked
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                : 'border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50/60'
            }`}
          >
            No
          </button>
        </div>
      );
    }

    return (
      <div className="mb-5 max-h-[44vh] space-y-2.5 overflow-y-auto pr-1">
        {question.choices?.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={isLocked}
            onClick={() => setSelectedValue(choice.text)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
              selectedValue === choice.text
                ? 'border-bears-navy bg-bears-navy/5 text-bears-navy'
                : isLocked
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                : 'border-slate-200 bg-white text-slate-700 hover:border-bears-navy/30 hover:bg-bears-navy/5'
            }`}
          >
            <span className="text-[13px] font-bold">{choice.text}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && question && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/35"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <form
              onSubmit={handleSubmit}
              className="mx-auto w-full max-w-[500px] rounded-3xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="p-4 sm:p-4">
                <h2 className="mb-2.5 pr-2 text-lg font-bold leading-snug text-bears-navy sm:text-xl">
                  {question.text}
                </h2>

                {isLocked && (
                  <div className="mb-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    Prediction is closed. You can view details below.
                  </div>
                )}

                {renderOptions()}

                {(userPrediction || question.correct_answer?.trim()) && (
                  <div className="mb-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm">
                    {userPrediction && (
                      <p className="font-semibold text-slate-800">
                        Your pick: <span className="text-bears-navy">{userPrediction.prediction}</span>{' '}
                        <span className="text-xs font-medium capitalize text-slate-500">({userPrediction.confidence})</span>
                      </p>
                    )}
                    {question.correct_answer?.trim() && (
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        Correct Answer: <span className="font-extrabold">{question.correct_answer}</span>
                      </p>
                    )}
                  </div>
                )}

                {!isLocked && (
                  <div className="mb-3">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      How confident are you?
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['low', 'medium', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSelectedConfidence(level)}
                          className={`rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
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
                )}

                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
                    {error}
                  </div>
                )}

                {!isLocked && (
                  <button
                    type="submit"
                    disabled={!selectedValue || !selectedConfidence || loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-bears-orange px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-bears-orange/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : submitLabel}
                  </button>
                )}

                {isLocked && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    Locked after deadline
                  </p>
                )}
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
