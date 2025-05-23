/*
  # Add Admin Support

  1. Changes
    - Add is_admin boolean field to auth.users table
    - Set specific user as admin
    - Add correct_answer field to questions table
    
  2. Security
    - Only admins can update question status and correct answers
*/

-- Add is_admin column to auth.users
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Set specific user as admin
UPDATE auth.users 
SET is_admin = true 
WHERE email = 'irfanbhanji@gmail.com';

-- Add correct_answer field to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS correct_answer text;

-- Create policy for admin access to update questions
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