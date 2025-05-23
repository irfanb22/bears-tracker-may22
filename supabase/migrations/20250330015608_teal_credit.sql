/*
  # Update RLS Policies for True Public Access

  1. Changes
    - Drop existing policies
    - Create new policy for true public read access
    - Maintain authenticated-only write policies
    - Add performance optimizations

  2. Security
    - Allow true public read access without authentication
    - Keep write operations restricted to authenticated users
*/

-- First ensure RLS is enabled
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for predictions" ON predictions;
DROP POLICY IF EXISTS "Authenticated users can insert predictions" ON predictions;
DROP POLICY IF EXISTS "Authenticated users can update predictions" ON predictions;
DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;

-- Create true public read access policy
CREATE POLICY "Public read access for predictions"
  ON predictions
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Create authenticated-only write policies
CREATE POLICY "Authenticated users can insert predictions"
  ON predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update predictions"
  ON predictions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predictions_aggregation 
  ON predictions(question_id, prediction);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id 
  ON predictions(user_id);

CREATE INDEX IF NOT EXISTS idx_predictions_user_question 
  ON predictions(user_id, question_id);