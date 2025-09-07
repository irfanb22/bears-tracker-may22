/*
  # Add display_name field to users table

  1. Schema Changes
    - Add `display_name` column to `users` table
    - Column type: text, nullable
    - Default value: NULL

  2. Security
    - Existing RLS policies will automatically cover this new column
    - Users can update their own display_name via existing "Users can update own data" policy

  3. Notes
    - Display name will be used for user profile customization
    - Validation will be handled on the client side (2-50 characters)
*/

-- Add display_name column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE users ADD COLUMN display_name text;
  END IF;
END $$;