/*
  # Allow scoring updates after deadline

  1. Problem
    - Existing trigger `enforce_prediction_deadline` blocks all UPDATEs on predictions.
    - This unintentionally blocks back-office scoring updates to `points_earned`.

  2. Fix
    - Keep deadline protection for user-facing prediction edits/inserts.
    - Skip deadline check when UPDATE only changes scoring/internal fields.
*/

CREATE OR REPLACE FUNCTION check_prediction_deadline()
RETURNS trigger AS $$
BEGIN
  -- Allow internal/admin score refresh updates after deadline.
  -- If prediction/question/confidence are unchanged, this is not a user prediction edit.
  IF TG_OP = 'UPDATE'
     AND NEW.prediction IS NOT DISTINCT FROM OLD.prediction
     AND NEW.confidence IS NOT DISTINCT FROM OLD.confidence
     AND NEW.question_id IS NOT DISTINCT FROM OLD.question_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM questions
    WHERE id = NEW.question_id
      AND deadline AT TIME ZONE 'America/Chicago' < CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago'
  ) THEN
    RAISE EXCEPTION 'Cannot make or update predictions after the deadline';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

