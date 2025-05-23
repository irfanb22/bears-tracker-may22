/*
  # Update Prediction Timestamps on Changes

  1. Changes
    - Add trigger to update created_at timestamp when predictions are modified
    - Ensure timestamp reflects the latest prediction change
    - Keep existing deadline enforcement trigger

  2. Security
    - No changes to security policies
    - Maintain existing access controls
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_prediction_timestamp ON predictions;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_prediction_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.created_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp
CREATE TRIGGER update_prediction_timestamp
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_timestamp();