/*
  # Update Prediction RLS Policies for Vote Aggregation

  1. Changes
    - Add policy to allow authenticated users to read all predictions
    - Keep existing policies for user-specific operations
    - Ensure proper aggregation access

  2. Security
    - Maintain write restrictions to user's own predictions
    - Allow read access to all predictions for vote counting
*/

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can read their own predictions" ON predictions;

-- Create new policies for predictions table
CREATE POLICY "Users can read all predictions for aggregation"
  ON predictions
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep existing insert/update policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'predictions' 
    AND policyname = 'Users can insert their own predictions'
  ) THEN
    CREATE POLICY "Users can insert their own predictions"
      ON predictions
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'predictions' 
    AND policyname = 'Users can update their own predictions'
  ) THEN
    CREATE POLICY "Users can update their own predictions"
      ON predictions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;