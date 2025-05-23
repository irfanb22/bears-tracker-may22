/*
  # Fix Admin Permissions

  1. Changes
    - Update questions table RLS policy to use email directly from JWT
    - Remove dependency on users table query
    - Ensure proper admin access to update questions

  2. Security
    - Maintain security by checking email from JWT claims
    - Keep existing RLS policies intact
*/

-- Drop the existing admin update policy
DROP POLICY IF EXISTS "Allow admins to update questions" ON questions;

-- Create new policy using JWT email claim
CREATE POLICY "Allow admins to update questions"
ON questions
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->>'email' = 'irfanbhanji@gmail.com'
)
WITH CHECK (
  auth.jwt()->>'email' = 'irfanbhanji@gmail.com'
);