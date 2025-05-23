/*
  # Add Prediction Count Column to Choices Table

  1. Changes
    - Add prediction_count column to choices table
    - Set default value to 0 for existing rows
    - Add index for better query performance

  2. Security
    - No changes to security policies
*/

-- Add prediction_count column to choices table
ALTER TABLE choices
ADD COLUMN prediction_count INTEGER DEFAULT 0;

-- Create index for prediction count queries
CREATE INDEX idx_choices_prediction_count 
ON choices(prediction_count);