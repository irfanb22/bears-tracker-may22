/*
  # Fix Public Access for Predictions

  1. Changes
    - Update RLS policies to properly handle public access
    - Remove any implicit authentication requirements
    - Ensure proper separation between read and write policies
    - Add existence checks to avoid conflicts

  2. Security
    - Allow true public access for read operations
    - Maintain write protection for authenticated users
*/

-- First ensure RLS is enabled
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Safely drop and recreate policies
DO $$ BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public read access for predictions" ON predictions;
  DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
  DROP POLICY IF EXISTS "Users can read their own predictions" ON predictions;
  DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
  DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;
  DROP POLICY IF EXISTS "Authenticated users can insert predictions" ON predictions;
  DROP POLICY IF EXISTS "Authenticated users can update predictions" ON predictions;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create true public read access policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'predictions' 
    AND policyname = 'Public read access for predictions'
  ) THEN
    CREATE POLICY "Public read access for predictions"
      ON predictions
      FOR SELECT
      TO PUBLIC
      USING (true);
  END IF;
END $$;

-- Create authenticated-only write policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'predictions' 
    AND policyname = 'Authenticated users can insert predictions'
  ) THEN
    CREATE POLICY "Authenticated users can insert predictions"
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
    AND policyname = 'Authenticated users can update predictions'
  ) THEN
    CREATE POLICY "Authenticated users can update predictions"
      ON predictions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create index for better aggregation performance if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'predictions' 
    AND indexname = 'idx_predictions_aggregation'
  ) THEN
    CREATE INDEX idx_predictions_aggregation 
      ON predictions(question_id, prediction);
  END IF;
END $$;