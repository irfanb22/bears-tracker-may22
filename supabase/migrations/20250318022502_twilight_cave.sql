/*
  # Add Prediction Deadlines and Status

  1. Changes
    - Add deadline column to questions table
    - Add status column to questions table
    - Update existing questions with deadlines
    - Add index for deadline queries

  2. Security
    - No changes to security policies
*/

-- Add deadline column to questions table
ALTER TABLE questions
ADD COLUMN deadline timestamptz;

-- Add status column to questions table
ALTER TABLE questions
ADD COLUMN status text NOT NULL DEFAULT 'live'
CHECK (status IN ('live', 'pending', 'completed'));

-- Create index for deadline queries
CREATE INDEX idx_questions_deadline ON questions(deadline);

-- Update existing questions with example deadlines
UPDATE questions
SET deadline = CASE id
  -- Caleb Williams passing record
  WHEN '550e8400-e29b-41d4-a716-446655440000' THEN '2025-12-31 23:59:59+00'::timestamptz
  -- Montez Sweat sacks
  WHEN '6ba7b810-9dad-11d1-80b4-00c04fd430c8' THEN '2025-12-31 23:59:59+00'::timestamptz
  -- Bears wins
  WHEN '6ba7b811-9dad-11d1-80b4-00c04fd430c8' THEN '2025-12-31 23:59:59+00'::timestamptz
  -- Joe Thuney Pro Bowl
  WHEN '6ba7b812-9dad-11d1-80b4-00c04fd430c8' THEN '2025-12-31 23:59:59+00'::timestamptz
  -- Rome Odunze receiving yards
  WHEN '6ba7b813-9dad-11d1-80b4-00c04fd430c8' THEN '2025-12-31 23:59:59+00'::timestamptz
  -- Bears playoffs
  WHEN '6ba7b814-9dad-11d1-80b4-00c04fd430c8' THEN '2025-12-31 23:59:59+00'::timestamptz
  -- Draft prediction
  WHEN '7ba7b814-9dad-11d1-80b4-00c04fd430c8' THEN '2025-04-25 23:59:59+00'::timestamptz
  ELSE now() + interval '1 year'
END;

-- Make deadline required
ALTER TABLE questions
ALTER COLUMN deadline SET NOT NULL;