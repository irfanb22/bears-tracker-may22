/*
  # Add prediction types and update predictions table

  1. Changes
    - Create prediction_types table if not exists
    - Insert default prediction types
    - Add prediction_type_id to predictions table
    - Update existing predictions with default type
    - Add not null constraint

  2. Security
    - Enable RLS on prediction_types table
    - Add policy for authenticated users to read prediction types
*/

-- Create prediction_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS prediction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prediction_types ENABLE ROW LEVEL SECURITY;

-- Create policy for reading prediction types
CREATE POLICY "Anyone can read prediction types"
  ON prediction_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default prediction types if they don't exist
INSERT INTO prediction_types (id, name)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'game'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0852', 'question')
ON CONFLICT (id) DO NOTHING;

-- Add prediction_type_id to predictions table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'predictions' 
    AND column_name = 'prediction_type_id'
  ) THEN
    ALTER TABLE predictions 
      ADD COLUMN prediction_type_id uuid REFERENCES prediction_types(id);
  END IF;
END $$;

-- Update existing predictions to use the 'question' type
UPDATE predictions 
SET prediction_type_id = 'd290f1ee-6c54-4b01-90e6-d701748f0852'
WHERE prediction_type_id IS NULL;

-- Make prediction_type_id not null
ALTER TABLE predictions 
  ALTER COLUMN prediction_type_id SET NOT NULL;