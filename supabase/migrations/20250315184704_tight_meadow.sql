/*
  # Enhanced Prediction System Schema

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `text` (text) - The yes/no question
      - `category` (text) - e.g., 'player_stats', 'team_performance'
      - `season` (integer) - The NFL season year
      - `created_at` (timestamptz)
    
    - `prediction_types`
      - `id` (uuid, primary key)
      - `name` (text) - Either 'game' or 'question'
      - `created_at` (timestamptz)
    
  2. Modified Tables
    - `predictions` table updated to:
      - Handle both game and question predictions
      - Use enum for confidence levels
      - Track points earned
    
    - `actual_results` table updated to:
      - Handle both game and question outcomes
      - Include verification date
      - Track points awarded

  3. Security
    - RLS policies maintained and extended to new tables
    - Added policies for question management
*/

-- Create prediction types enum
CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');

-- Create prediction types table
CREATE TABLE IF NOT EXISTS prediction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (name IN ('game', 'question')),
  created_at timestamptz DEFAULT now()
);

-- Insert prediction types
INSERT INTO prediction_types (name) VALUES ('game'), ('question');

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  category text NOT NULL,
  season integer NOT NULL CHECK (season >= 2024),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Questions are viewable by all authenticated users
CREATE POLICY "Questions are viewable by all users"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Modify predictions table
ALTER TABLE predictions
  -- Drop the existing confidence_level column
  DROP COLUMN confidence_level,
  -- Add new columns
  ADD COLUMN prediction_type_id uuid REFERENCES prediction_types NOT NULL,
  ADD COLUMN question_id uuid REFERENCES questions,
  ADD COLUMN confidence confidence_level NOT NULL,
  ADD COLUMN points_earned integer DEFAULT 0,
  -- Add check constraint to ensure either game_id or question_id is set, but not both
  ADD CONSTRAINT prediction_target_check 
    CHECK (
      (game_id IS NOT NULL AND question_id IS NULL) OR 
      (game_id IS NULL AND question_id IS NOT NULL)
    );

-- Modify actual_results table
ALTER TABLE actual_results
  ADD COLUMN question_id uuid REFERENCES questions,
  ADD COLUMN verification_date timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN points_possible integer NOT NULL DEFAULT 10,
  -- Add check constraint similar to predictions
  ADD CONSTRAINT result_target_check 
    CHECK (
      (game_id IS NOT NULL AND question_id IS NULL) OR 
      (game_id IS NULL AND question_id IS NOT NULL)
    );

-- Create view for user scores
CREATE OR REPLACE VIEW user_scores AS
SELECT 
  p.user_id,
  COUNT(*) as total_predictions,
  SUM(p.points_earned) as total_points,
  ROUND(AVG(p.points_earned)::numeric, 2) as average_points,
  COUNT(*) FILTER (WHERE p.prediction_type_id = (SELECT id FROM prediction_types WHERE name = 'game')) as game_predictions,
  COUNT(*) FILTER (WHERE p.prediction_type_id = (SELECT id FROM prediction_types WHERE name = 'question')) as question_predictions
FROM predictions p
GROUP BY p.user_id;

-- Add scoring function
CREATE OR REPLACE FUNCTION calculate_prediction_points(
  prediction_value text,
  actual_value text,
  confidence confidence_level,
  points_possible integer
) RETURNS integer AS $$
BEGIN
  -- For correct predictions
  IF prediction_value = actual_value THEN
    CASE confidence
      WHEN 'low' THEN RETURN FLOOR(points_possible * 0.5);
      WHEN 'medium' THEN RETURN FLOOR(points_possible * 0.75);
      WHEN 'high' THEN RETURN points_possible;
    END CASE;
  -- For incorrect predictions
  ELSE
    CASE confidence
      WHEN 'low' THEN RETURN FLOOR(points_possible * -0.25);
      WHEN 'medium' THEN RETURN FLOOR(points_possible * -0.5);
      WHEN 'high' THEN RETURN FLOOR(points_possible * -1);
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update points when actual results are added
CREATE OR REPLACE FUNCTION update_prediction_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update points for matching predictions
  UPDATE predictions p
  SET points_earned = calculate_prediction_points(
    p.prediction,
    NEW.result,
    p.confidence,
    NEW.points_possible
  )
  WHERE (p.game_id = NEW.game_id OR p.question_id = NEW.question_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actual_results_points_trigger
  AFTER INSERT ON actual_results
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_points();

-- Update existing RLS policies for modified tables
CREATE POLICY "Users can view all actual results"
  ON actual_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Add indexes for better query performance
CREATE INDEX idx_predictions_user_game ON predictions(user_id, game_id);
CREATE INDEX idx_predictions_user_question ON predictions(user_id, question_id);
CREATE INDEX idx_actual_results_game ON actual_results(game_id);
CREATE INDEX idx_actual_results_question ON actual_results(question_id);