/*
  # Add questions table and initial data

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `text` (text, not null)
      - `category` (text, not null)
      - `season` (integer, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on questions table
    - Add policy for authenticated users to read questions

  3. Initial Data
    - Insert the five questions currently shown in the frontend
*/

-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  category text NOT NULL,
  season integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading questions if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'questions' 
    AND policyname = 'Questions are viewable by all users'
  ) THEN
    CREATE POLICY "Questions are viewable by all users"
      ON questions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Insert initial questions
INSERT INTO questions (id, text, category, season)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Does Caleb Williams break the single season yards record?', 'player_stats', 2025),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Does Montez Sweat get over 10 sacks?', 'player_stats', 2025),
  ('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Bears over 9 wins?', 'team_stats', 2025),
  ('6ba7b812-9dad-11d1-80b4-00c04fd430c8', 'Does Joe Thuney make the Pro Bowl?', 'player_stats', 2025),
  ('6ba7b813-9dad-11d1-80b4-00c04fd430c8', 'Rome Odunze has over 1000 yards receiving?', 'player_stats', 2025)
ON CONFLICT (id) DO UPDATE
SET 
  text = EXCLUDED.text,
  category = EXCLUDED.category,
  season = EXCLUDED.season;

-- Add season check constraint if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'questions_season_check'
  ) THEN
    ALTER TABLE questions
      ADD CONSTRAINT questions_season_check
      CHECK (season >= 2024);
  END IF;
END $$;