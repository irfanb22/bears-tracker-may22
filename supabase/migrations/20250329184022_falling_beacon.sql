/*
  # Add Featured Questions Support

  1. Changes
    - Add featured boolean field to questions table
    - Set default value to false
    - Add index for better query performance
    - Update existing questions to have featured status

  2. Security
    - No changes to security policies
    - Featured status managed through existing admin policies
*/

-- Add featured column to questions table
ALTER TABLE questions
ADD COLUMN featured boolean NOT NULL DEFAULT false;

-- Create index for featured queries
CREATE INDEX idx_questions_featured 
ON questions(featured);

-- Update some existing questions to be featured
UPDATE questions 
SET featured = true 
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440000', -- Caleb Williams
  '6ba7b814-9dad-11d1-80b4-00c04fd430c8'  -- Playoffs
);