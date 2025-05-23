/*
  # Create predictions table and related tables

  1. New Tables
    - `predictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `question_id` (text)
      - `prediction` (text)
      - `confidence` (confidence_level)
      - `points_earned` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on predictions table
    - Add policies for authenticated users to:
      - Insert their own predictions
      - Update their own predictions
      - Read their own predictions
*/

-- Create confidence_level enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create predictions table if it doesn't exist
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  question_id text NOT NULL,
  prediction text NOT NULL,
  confidence confidence_level NOT NULL,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
  DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;
  DROP POLICY IF EXISTS "Users can read their own predictions" ON predictions;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create policies
CREATE POLICY "Users can insert their own predictions"
  ON predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON predictions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own predictions"
  ON predictions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
  CREATE INDEX IF NOT EXISTS idx_predictions_question_id ON predictions(question_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;