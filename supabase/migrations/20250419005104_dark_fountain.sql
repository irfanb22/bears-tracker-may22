/*
  # Update Deadlines to Central Time

  1. Changes
    - Update existing deadlines to be in Central Time
    - Add function to handle timezone conversion
    - Update trigger to use Central Time for deadline checks

  2. Security
    - No changes to security policies
*/

-- Update the draft prediction deadline to April 24, 2025 5:00 PM Central Time
UPDATE questions
SET deadline = '2025-04-24 17:00:00-05'
WHERE id = '7ba7b814-9dad-11d1-80b4-00c04fd430c8';

-- Update other deadlines to end of 2025 season in Central Time
UPDATE questions
SET deadline = '2025-12-31 23:59:59-06'
WHERE id != '7ba7b814-9dad-11d1-80b4-00c04fd430c8';

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS enforce_prediction_deadline ON predictions;
DROP FUNCTION IF EXISTS check_prediction_deadline();

-- Create updated function to check deadline in Central Time
CREATE OR REPLACE FUNCTION check_prediction_deadline()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM questions
    WHERE id = NEW.question_id
    AND deadline AT TIME ZONE 'America/Chicago' < CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago'
  ) THEN
    RAISE EXCEPTION 'Cannot make or update predictions after the deadline';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER enforce_prediction_deadline
  BEFORE INSERT OR UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION check_prediction_deadline();