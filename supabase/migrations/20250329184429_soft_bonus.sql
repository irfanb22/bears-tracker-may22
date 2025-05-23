/*
  # Update Featured Questions Support

  1. Changes
    - Safely add featured column if it doesn't exist
    - Create index for featured queries if it doesn't exist
    - Update existing questions to be featured

  2. Security
    - No changes to security policies
    - Featured status managed through existing admin policies
*/

-- Safely add featured column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' 
    AND column_name = 'featured'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN featured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create index for featured queries if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'questions' 
    AND indexname = 'idx_questions_featured'
  ) THEN
    CREATE INDEX idx_questions_featured 
    ON questions(featured);
  END IF;
END $$;

-- Update some existing questions to be featured
UPDATE questions 
SET featured = true 
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440000', -- Caleb Williams
  '6ba7b814-9dad-11d1-80b4-00c04fd430c8'  -- Playoffs
);