/*
  # Update RLS Policies for Public Access

  1. Changes
    - Enable RLS on all tables
    - Update policies to allow public read access
    - Keep existing policies for authenticated users
    - Add indexes for better performance

  2. Security
    - Allow public read access to questions and predictions
    - Maintain write restrictions to authenticated users only
*/

-- First ensure RLS is enabled on all tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON questions;
DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
DROP POLICY IF EXISTS "Choices are viewable by all users" ON choices;

-- Create new policies for public read access
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

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_featured ON questions(featured);
CREATE INDEX IF NOT EXISTS idx_questions_deadline ON questions(deadline);
CREATE INDEX IF NOT EXISTS idx_predictions_aggregation ON predictions(question_id, prediction);
CREATE INDEX IF NOT EXISTS idx_predictions_user_question ON predictions(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_choices_question ON choices(question_id);