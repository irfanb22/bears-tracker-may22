/*
  # Update Predictions RLS for Public Access

  1. Changes
    - Drop existing select policies
    - Create new policy allowing public read access
    - Add index for better aggregation performance

  2. Security
    - Maintain write restrictions to authenticated users
    - Allow read access to all predictions for vote counting
*/

-- Drop existing select policies if they exist
DROP POLICY IF EXISTS "Users can read all predictions for aggregation" ON predictions;
DROP POLICY IF EXISTS "Anyone can read predictions for aggregation" ON predictions;

-- Create new policy for public read access
CREATE POLICY "Anyone can read predictions"
  ON predictions
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Create index for aggregation queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_predictions_aggregation 
  ON predictions(question_id, prediction);

-- Create index for prediction counts if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_predictions_user_question 
  ON predictions(user_id, question_id);