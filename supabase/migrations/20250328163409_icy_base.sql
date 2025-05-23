/*
  # Add Admin Support and Fix Policy Creation

  1. Changes
    - Add is_admin column to auth.users table if not exists
    - Set specific user as admin
    - Add correct_answer field to questions table if not exists
    - Safely create or update admin policy
    
  2. Security
    - Only admins can update question status and correct answers
    - Use safe policy creation with existence check
*/

-- Add is_admin column to auth.users if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE auth.users 
    ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Set specific user as admin
UPDATE auth.users 
SET is_admin = true 
WHERE email = 'irfanbhanji@gmail.com';

-- Add correct_answer field to questions table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'questions' 
    AND column_name = 'correct_answer'
  ) THEN
    ALTER TABLE questions 
    ADD COLUMN correct_answer text;
  END IF;
END $$;

-- Safely create or update admin policy
DO $$ BEGIN
  -- Drop the policy if it exists
  DROP POLICY IF EXISTS "Allow admins to update questions" ON questions;
  
  -- Create the policy
  CREATE POLICY "Allow admins to update questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.is_admin = true OR auth.users.email = 'irfanbhanji@gmail.com')
    )
  );
END $$;