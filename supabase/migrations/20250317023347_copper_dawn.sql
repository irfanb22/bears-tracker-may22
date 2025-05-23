/*
  # Clean up duplicate predictions and ensure unique constraint

  1. Changes
    - Create a temporary table to store the latest predictions
    - Remove duplicate predictions, keeping only the most recent one per user/question
    - Add unique constraint if it doesn't exist
    - Add index for better query performance

  2. Security
    - No changes to security policies
*/

-- First, create a temporary table to store the latest predictions
CREATE TEMP TABLE latest_predictions AS
SELECT DISTINCT ON (user_id, question_id)
  id,
  user_id,
  question_id,
  prediction,
  confidence,
  points_earned,
  created_at,
  prediction_type_id
FROM predictions
ORDER BY user_id, question_id, created_at DESC;

-- Delete all predictions
DELETE FROM predictions;

-- Reinsert only the latest predictions
INSERT INTO predictions (
  id,
  user_id,
  question_id,
  prediction,
  confidence,
  points_earned,
  created_at,
  prediction_type_id
)
SELECT
  id,
  user_id,
  question_id,
  prediction,
  confidence,
  points_earned,
  created_at,
  prediction_type_id
FROM latest_predictions;

-- Drop the temporary table
DROP TABLE latest_predictions;

-- Add the unique constraint if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_question_prediction'
  ) THEN
    ALTER TABLE predictions
    ADD CONSTRAINT unique_user_question_prediction 
    UNIQUE (user_id, question_id);
  END IF;
END $$;

-- Add an index to improve query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_predictions_user_question
ON predictions(user_id, question_id);