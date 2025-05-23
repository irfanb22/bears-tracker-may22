/*
  # Fix Questions RLS Policies

  1. Changes
    - Drop existing policies
    - Enable RLS on questions table
    - Create new policy for public read access
    - Add index for better performance

  2. Security
    - Allow public read access to questions
    - Maintain admin-only write access
*/

-- First ensure RLS is enabled
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Questions are viewable by all users" ON questions;
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON questions;
DROP POLICY IF EXISTS "Allow admins to update questions" ON questions;
DROP POLICY IF EXISTS "Allow admins to modify questions" ON questions;
DROP POLICY IF EXISTS "Allow admins to insert questions" ON questions;

-- Create new policy for public read access
CREATE POLICY "Questions are viewable by everyone"
  ON questions
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Recreate admin policies
CREATE POLICY "Allow admins to modify questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'email' = 'irfanbhanji@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'irfanbhanji@gmail.com');

CREATE POLICY "Allow admins to insert questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'email' = 'irfanbhanji@gmail.com');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_featured ON questions(featured);
CREATE INDEX IF NOT EXISTS idx_questions_deadline ON questions(deadline);