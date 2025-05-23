/*
  # Update Questions RLS Policy for Public Access

  1. Changes
    - Drop existing select policy for questions table
    - Create new policy to allow public access to questions
    - Keep admin-only policies for updates/inserts

  2. Security
    - Allow anyone to read questions
    - Maintain restricted write access
*/

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Questions are viewable by all users" ON questions;

-- Create new policy for public read access
CREATE POLICY "Questions are viewable by everyone"
  ON questions
  FOR SELECT
  USING (true);

-- Create index for better read performance if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'questions' 
    AND indexname = 'idx_questions_status'
  ) THEN
    CREATE INDEX idx_questions_status ON questions(status);
  END IF;
END $$;