/*
  # Add unique constraint for user predictions

  1. Changes
    - Remove duplicate predictions by keeping only the latest prediction for each user-question pair
    - Add unique constraint on predictions table for user_id and question_id combination
    - This ensures each user can only have one active prediction per question

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

-- Now we can safely add the unique constraint
ALTER TABLE predictions
ADD CONSTRAINT unique_user_question_prediction 
UNIQUE (user_id, question_id);

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_predictions_user_question
ON predictions(user_id, question_id);