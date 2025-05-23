/*
  # Fix Admin Insert Permissions

  1. Changes
    - Add policy to allow admins to insert questions
    - Use JWT email claim for admin check
    - Keep existing policies intact

  2. Security
    - Maintain security by checking email from JWT claims
    - Only allow specific admin email to insert questions
*/

-- Create policy for admin insert access
CREATE POLICY "Allow admins to insert questions"
ON questions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'email' = 'irfanbhanji@gmail.com'
);