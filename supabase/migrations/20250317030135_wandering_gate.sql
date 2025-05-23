/*
  # Add Multiple Choice Questions Support

  1. Changes
    - Add question_type field to questions table
    - Create choices table for multiple choice options
    - Add sample draft prospects
    - Update existing questions to have question_type
    - Add draft prospect question

  2. Security
    - Enable RLS on choices table
    - Add policy for authenticated users to read choices
*/

-- Add question_type to questions table
ALTER TABLE questions 
ADD COLUMN question_type text NOT NULL DEFAULT 'yes_no'
CHECK (question_type IN ('yes_no', 'multiple_choice'));

-- Create choices table
CREATE TABLE choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on choices
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;

-- Add policy for reading choices
CREATE POLICY "Choices are viewable by all users"
  ON choices
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_choices_question ON choices(question_id);

-- Insert draft prospect question
INSERT INTO questions (id, text, category, season, question_type)
VALUES (
  '7ba7b814-9dad-11d1-80b4-00c04fd430c8',
  'Who Will the Bears Draft in the 1st Round?',
  'draft_predictions',
  2025,
  'multiple_choice'
);

-- Insert draft prospect choices
INSERT INTO choices (question_id, text)
VALUES 
  ('7ba7b814-9dad-11d1-80b4-00c04fd430c8', 'Will Campbell (Tackle, LSU)'),
  ('7ba7b814-9dad-11d1-80b4-00c04fd430c8', 'Kelvin Banks (Tackle, Texas)'),
  ('7ba7b814-9dad-11d1-80b4-00c04fd430c8', 'Ashton Jeanty (RB, Boise State)'),
  ('7ba7b814-9dad-11d1-80b4-00c04fd430c8', 'Tyler Warren (TE, Penn State)'),
  ('7ba7b814-9dad-11d1-80b4-00c04fd430c8', 'Mason Graham (DT, Michigan)'),
  ('7ba7b814-9dad-11d1-80b4-00c04fd430c8', 'Armand Membou (OT, Missouri)'),
  ('7ba7b814-9dad-11d1-80b4-00c04fd430c8', 'Other');

-- Update existing questions to have yes_no type
UPDATE questions 
SET question_type = 'yes_no' 
WHERE question_type = 'yes_no';