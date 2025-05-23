/*
  # Initial Schema Setup

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `opponent` (text)
      - `date` (timestamptz)
      - `location` (text)
      - `created_at` (timestamptz)
    
    - `predictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `game_id` (uuid, foreign key to games)
      - `prediction` (text)
      - `confidence_level` (integer)
      - `created_at` (timestamptz)
    
    - `season_stats`
      - `id` (uuid, primary key)
      - `player_name` (text)
      - `stat_category` (text)
      - `predicted_value` (numeric)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
    
    - `actual_results`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key to games)
      - `result` (text)
      - `stats` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read all games and actual_results
      - Read/write their own predictions and season_stats
*/

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent text NOT NULL,
  date timestamptz NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by all users"
  ON games
  FOR SELECT
  TO authenticated
  USING (true);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  game_id uuid REFERENCES games NOT NULL,
  prediction text NOT NULL,
  confidence_level integer CHECK (confidence_level BETWEEN 1 AND 100),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own predictions"
  ON predictions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Season Stats table
CREATE TABLE IF NOT EXISTS season_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  stat_category text NOT NULL,
  predicted_value numeric NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE season_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own season stats predictions"
  ON season_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own season stats predictions"
  ON season_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own season stats predictions"
  ON season_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Actual Results table
CREATE TABLE IF NOT EXISTS actual_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games NOT NULL,
  result text NOT NULL,
  stats jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE actual_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actual results are viewable by all users"
  ON actual_results
  FOR SELECT
  TO authenticated
  USING (true);