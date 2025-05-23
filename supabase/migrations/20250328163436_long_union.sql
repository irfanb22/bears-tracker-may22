/*
  # Update Admin Policy to Use JWT Claims

  1. Changes
    - Drop existing admin update policy
    - Create new policy using JWT email claim for better security
    - Add both USING and WITH CHECK clauses for complete access control

  2. Security
    - Use JWT claims directly instead of querying auth.users table
    - Maintain admin-only access for question updates
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow admins to update questions" ON questions;
  DROP POLICY IF EXISTS "Allow admins to modify questions" ON questions;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create new policy using JWT email claim
CREATE POLICY "Allow admins to modify questions"
ON questions
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->>'email' = 'irfanbhanji@gmail.com'
)
WITH CHECK (
  auth.jwt()->>'email' = 'irfanbhanji@gmail.com'
);