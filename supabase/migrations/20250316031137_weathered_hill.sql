/*
  # Update prediction questions and add playoffs question

  1. Changes
    - Update existing questions with more specific text
    - Add new playoffs question
    - Maintain existing IDs for data consistency

  2. Security
    - No changes to security policies
*/

-- Update existing questions
UPDATE questions
SET text = 'Will Caleb Williams break the Bears single-season passing record (3,838 yards)?'
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

UPDATE questions
SET text = 'Will Montez Sweat record 10+ sacks?'
WHERE id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

UPDATE questions
SET text = 'Will the Bears win more than 9 games?'
WHERE id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

UPDATE questions
SET text = 'Will Joe Thuney be selected to the Pro Bowl?'
WHERE id = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';

UPDATE questions
SET text = 'Will Rome Odunze surpass 1,000 receiving yards?'
WHERE id = '6ba7b813-9dad-11d1-80b4-00c04fd430c8';

-- Add new playoffs question
INSERT INTO questions (id, text, category, season)
VALUES (
  '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
  'Will the Bears make the playoffs?',
  'team_stats',
  2025
);