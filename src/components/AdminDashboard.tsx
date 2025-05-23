import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Loader2, Save, AlertCircle, Plus, X, Edit2, 
  CheckCircle, PlusCircle, MinusCircle, Star, StarOff
} from 'lucide-react';
import { Navbar } from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { DateTimePicker } from './DateTimePicker';

interface Question {
  id: string;
  text: string;
  status: 'live' | 'pending' | 'completed';
  deadline: string;
  correct_answer: string | null;
  question_type: 'yes_no' | 'multiple_choice';
  category: string;
  featured: boolean;
  choices?: Choice[];
}

interface Choice {
  id?: string;
  text: string;
  prediction_count?: number;
}

interface NewQuestion {
  text: string;
  category: string;
  question_type: 'yes_no' | 'multiple_choice';
  deadline: string;
  featured: boolean;
  choices: Choice[];
}

const INITIAL_NEW_QUESTION: NewQuestion = {
  text: '',
  category: 'player_stats',
  question_type: 'yes_no',
  deadline: new Date().toISOString(),
  featured: false,
  choices: [],
};

export function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<NewQuestion>(INITIAL_NEW_QUESTION);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  async function updateQuestion(questionId: string, updates: Partial<Question>) {
    setSaving(prev => ({ ...prev, [questionId]: true }));
    setError(null);

    try {
      const { error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId ? { ...q, ...updates } : q
        )
      );

      setSuccess('Question updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      setEditingQuestionId(null);
    } catch (err) {
      console.error('Error updating question:', err);
      setError(err instanceof Error ? err.message : 'Failed to update question');
    } finally {
      setSaving(prev => ({ ...prev, [questionId]: false }));
    }
  }

  async function createQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(prev => ({ ...prev, new: true }));
    setError(null);

    try {
      const { data, error: questionError } = await supabase
        .from('questions')
        .insert({
          text: newQuestion.text,
          category: newQuestion.category,
          question_type: newQuestion.question_type,
          deadline: newQuestion.deadline,
          featured: newQuestion.featured,
          season: 2025,
          status: 'pending'
        })
        .select()
        .single();

      if (questionError) throw questionError;

      if (newQuestion.question_type === 'multiple_choice' && newQuestion.choices.length > 0) {
        const { error: choicesError } = await supabase
          .from('choices')
          .insert(
            newQuestion.choices.map(choice => ({
              question_id: data.id,
              text: choice.text
            }))
          );

        if (choicesError) throw choicesError;
      }

      await fetchQuestions();
      setShowNewQuestionForm(false);
      setNewQuestion(INITIAL_NEW_QUESTION);
      setSuccess('Question created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating question:', err);
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setSaving(prev => ({ ...prev, new: false }));
    }
  }

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-bears-navy">Admin Dashboard</h1>
          <button
            onClick={() => setShowNewQuestionForm(!showNewQuestionForm)}
            className="flex items-center gap-2 px-4 py-2 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors"
          >
            {showNewQuestionForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showNewQuestionForm ? 'Cancel' : 'New Question'}
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNewQuestionForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-bears-navy">Create New Question</h2>
              </div>

              <form onSubmit={createQuestion} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-bears-orange focus:border-bears-orange"
                    placeholder="Enter your question"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newQuestion.category}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-bears-orange focus:border-bears-orange"
                      required
                    >
                      <option value="player_stats">Player Stats</option>
                      <option value="team_stats">Team Stats</option>
                      <option value="draft_predictions">Draft Predictions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <DateTimePicker
                      value={newQuestion.deadline}
                      onChange={(value) => setNewQuestion(prev => ({ ...prev, deadline: value }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={newQuestion.question_type === 'yes_no'}
                        onChange={() => setNewQuestion(prev => ({ 
                          ...prev, 
                          question_type: 'yes_no',
                          choices: []
                        }))}
                        className="text-bears-orange focus:ring-bears-orange"
                        required
                      />
                      Yes/No
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={newQuestion.question_type === 'multiple_choice'}
                        onChange={() => setNewQuestion(prev => ({ 
                          ...prev, 
                          question_type: 'multiple_choice',
                          choices: [{ text: '' }]
                        }))}
                        className="text-bears-orange focus:ring-bears-orange"
                      />
                      Multiple Choice
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={newQuestion.featured}
                      onChange={(e) => setNewQuestion(prev => ({ 
                        ...prev, 
                        featured: e.target.checked 
                      }))}
                      className="text-bears-orange focus:ring-bears-orange rounded"
                    />
                    Featured Question
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Featured questions appear at the top of the list and receive special styling
                  </p>
                </div>

                {newQuestion.question_type === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choices
                    </label>
                    <div className="space-y-3">
                      {newQuestion.choices.map((choice, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={choice.text}
                            onChange={(e) => {
                              const newChoices = [...newQuestion.choices];
                              newChoices[index].text = e.target.value;
                              setNewQuestion(prev => ({ ...prev, choices: newChoices }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-bears-orange focus:border-bears-orange"
                            placeholder={`Choice ${index + 1}`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newChoices = newQuestion.choices.filter((_, i) => i !== index);
                              setNewQuestion(prev => ({ ...prev, choices: newChoices }));
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <MinusCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setNewQuestion(prev => ({ 
                          ...prev, 
                          choices: [...prev.choices, { text: '' }]
                        }))}
                        className="flex items-center gap-2 text-bears-navy hover:text-bears-orange transition-colors"
                      >
                        <PlusCircle className="w-5 h-5" />
                        Add Choice
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving.new || !newQuestion.text}
                    className="flex items-center gap-2 px-6 py-2 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving.new ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Create Question
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-bears-navy">Manage Questions</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {questions.map(question => (
              <div key={question.id} className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    {editingQuestionId === question.id ? (
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => setQuestions(prev =>
                          prev.map(q =>
                            q.id === question.id ? { ...q, text: e.target.value } : q
                          )
                        )}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-bears-orange focus:border-bears-orange"
                      />
                    ) : (
                      <div className="flex items-start gap-3 flex-1">
                        {question.featured && (
                          <Star className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        )}
                        <h3 className="text-lg font-medium text-bears-navy">{question.text}</h3>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuestion(question.id, { 
                          featured: !question.featured 
                        })}
                        className={`p-2 rounded-lg transition-colors ${
                          question.featured
                            ? 'text-yellow-400 hover:text-yellow-500'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={question.featured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        {question.featured ? (
                          <StarOff className="w-5 h-5" />
                        ) : (
                          <Star className="w-5 h-5" />
                        )}
                      </button>
                      {editingQuestionId === question.id ? (
                        <>
                          <button
                            onClick={() => updateQuestion(question.id, { text: question.text })}
                            className="p-2 text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingQuestionId(null)}
                            className="p-2 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingQuestionId(question.id)}
                          className="p-2 text-gray-400 hover:text-bears-navy transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={question.status}
                        onChange={(e) => updateQuestion(question.id, { 
                          status: e.target.value as Question['status']
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-bears-orange focus:border-bears-orange"
                      >
                        <option value="live">Live</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deadline
                      </label>
                      <DateTimePicker
                        value={question.deadline}
                        onChange={(value) => updateQuestion(question.id, { deadline: value })}
                        className="w-full"
                      />
                    </div>

                    {question.status === 'completed' && question.question_type === 'yes_no' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct Answer
                        </label>
                        <select
                          value={question.correct_answer || ''}
                          onChange={(e) => updateQuestion(question.id, { 
                            correct_answer: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-bears-orange focus:border-bears-orange"
                        >
                          <option value="">Select Answer</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {question.question_type === 'multiple_choice' && question.choices && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Choices</h4>
                      <div className="space-y-2">
                        {question.choices.map((choice) => (
                          <div key={choice.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span>{choice.text}</span>
                            <span className="text-sm text-gray-500">
                              {choice.prediction_count || 0} predictions
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {saving[question.id] && (
                    <div className="flex items-center gap-2 text-bears-orange">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Saving...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}