/*
  # Simple season scoring for Bears predictions

  1. Scoring model
    - 1 point for correct prediction
    - 0 points for incorrect or unresolved prediction
    - Confidence does not affect points

  2. Scope
    - Scoring is season-aware via questions.season
    - Default season for scoring function is 2025
*/

CREATE OR REPLACE FUNCTION public.recalculate_season_prediction_scores(target_season integer DEFAULT 2025)
RETURNS TABLE (
  updated_predictions integer,
  resolved_predictions integer,
  correct_predictions integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
  resolved_count integer := 0;
  correct_count integer := 0;
BEGIN
  UPDATE predictions p
  SET points_earned = CASE
    WHEN q.correct_answer IS NULL OR btrim(q.correct_answer) = '' THEN 0
    WHEN lower(btrim(p.prediction)) = lower(btrim(q.correct_answer)) THEN 1
    ELSE 0
  END
  FROM questions q
  WHERE p.question_id::text = q.id::text
    AND q.season = target_season;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  SELECT
    COUNT(*) FILTER (WHERE q.correct_answer IS NOT NULL AND btrim(q.correct_answer) <> ''),
    COUNT(*) FILTER (
      WHERE q.correct_answer IS NOT NULL
        AND btrim(q.correct_answer) <> ''
        AND lower(btrim(p.prediction)) = lower(btrim(q.correct_answer))
    )
  INTO resolved_count, correct_count
  FROM predictions p
  JOIN questions q ON p.question_id::text = q.id::text
  WHERE q.season = target_season;

  RETURN QUERY
  SELECT updated_count, resolved_count, correct_count;
END;
$$;

-- Run once for current season data.
SELECT * FROM public.recalculate_season_prediction_scores(2025);

