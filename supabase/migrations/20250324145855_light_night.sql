/*
  # Update Prediction RLS Policies for Public Vote Access

  1. Changes
    - Add policy to allow public read access for predictions
    - Keep existing policies for user-specific operations
    - Ensure proper aggregation access for all users

  2. Security
    - Maintain write restrictions to user's own predictions
    - Allow read access to all predictions for vote counting
*/

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can read all predictions for aggregation" ON predictions;

-- Create new policy for public read access
CREATE POLICY "Anyone can read predictions for aggregation"
  ON predictions
  FOR SELECT
  USING (true);

-- Create index for aggregation queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_predictions_aggregation 
  ON predictions(question_id, prediction);