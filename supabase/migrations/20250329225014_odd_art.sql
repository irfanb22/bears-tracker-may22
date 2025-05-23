/*
  # Update RLS Policies for Public Access

  1. Changes
    - Enable RLS on all relevant tables
    - Create public read access policies
    - Maintain write protection for authenticated users
    - Add appropriate indexes for performance

  2. Security
    - Allow public read access for aggregation
    - Maintain write restrictions to authenticated users only
    - Ensure proper access control for admin operations
*/

-- First ensure RLS is enabled on all tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON questions;
DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
DROP POLICY IF EXISTS "Choices are viewable by everyone" ON choices;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;

-- Create policies for public read access
CREATE POLICY "Questions are viewable by everyone"
  ON questions
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Anyone can read predictions"
  ON predictions
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Choices are viewable by everyone"
  ON choices
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Create policies for authenticated write access
CREATE POLICY "Users can insert their own predictions"
  ON predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON predictions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_featured ON questions(featured);
CREATE INDEX IF NOT EXISTS idx_questions_deadline ON questions(deadline);
CREATE INDEX IF NOT EXISTS idx_predictions_aggregation ON predictions(question_id, prediction);
CREATE INDEX IF NOT EXISTS idx_predictions_user_question ON predictions(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_choices_question ON choices(question_id);
CREATE INDEX IF NOT EXISTS idx_choices_prediction_count ON choices(prediction_count);