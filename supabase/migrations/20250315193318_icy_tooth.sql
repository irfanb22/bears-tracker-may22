/*
  # Update predictions table constraints

  1. Changes
    - Make game_id nullable
    - Ensure foreign key and check constraints exist
    - Add index for question_id

  2. Security
    - Maintain existing RLS policies
*/

-- Make game_id nullable
ALTER TABLE predictions 
  ALTER COLUMN game_id DROP NOT NULL;

-- Add foreign key constraint for question_id if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'predictions_question_id_fkey'
    AND table_name = 'predictions'
  ) THEN
    ALTER TABLE predictions 
      ADD CONSTRAINT predictions_question_id_fkey 
      FOREIGN KEY (question_id) 
      REFERENCES questions(id);
  END IF;
END $$;

-- Create index on question_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_predictions_question_id 
  ON predictions(question_id);