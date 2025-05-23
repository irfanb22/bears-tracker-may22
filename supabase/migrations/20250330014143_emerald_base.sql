/*
  # Fix Public Access for Predictions

  1. Changes
    - Update RLS policies to properly handle public access
    - Remove any implicit authentication requirements
    - Ensure proper separation between read and write policies

  2. Security
    - Allow true public access for read operations
    - Maintain write protection for authenticated users
*/

-- First ensure RLS is enabled
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;

-- Create true public read access policy
CREATE POLICY "Public read access for predictions"
  ON predictions
  FOR SELECT
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

-- Create index for better aggregation performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_predictions_aggregation 
  ON predictions(question_id, prediction);