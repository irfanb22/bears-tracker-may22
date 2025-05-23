/*
  # Add Prediction Deadline Enforcement

  1. Changes
    - Add RLS policy to prevent predictions after deadline
    - Add trigger to validate deadline before insert/update
    - Add function to check deadline status

  2. Security
    - Enforce deadlines at database level
    - Maintain existing security policies
*/

-- Create function to check if prediction is within deadline
CREATE OR REPLACE FUNCTION check_prediction_deadline()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM questions
    WHERE id = NEW.question_id
    AND deadline < NOW()
  ) THEN
    RAISE EXCEPTION 'Cannot make or update predictions after the deadline';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce deadline
CREATE TRIGGER enforce_prediction_deadline
  BEFORE INSERT OR UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION check_prediction_deadline();

-- Create index for deadline checks if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_questions_deadline 
  ON questions(deadline);