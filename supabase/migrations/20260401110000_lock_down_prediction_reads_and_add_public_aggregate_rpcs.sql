/*
  # Lock down raw prediction reads and expose only safe aggregates

  Why:
  - The browser currently reads raw rows from `public.predictions` to build charts.
  - That exposes per-user prediction data and makes it easy to accidentally leak private rows.
  - The safer model is: raw rows stay private, public pages consume aggregate RPCs.

  What this changes:
  - Remove broad `SELECT` policies on `public.predictions`
  - Recreate a strict "users can read only their own predictions" policy
  - Add `public.get_public_question_prediction_summary(target_season)` for aggregate vote counts
  - Add `public.get_question_confidence_sentiment(target_season)` for the confidence meter UI
*/

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for predictions" ON public.predictions;
DROP POLICY IF EXISTS "Anyone can read predictions" ON public.predictions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'predictions'
      AND policyname = 'Users can read their own predictions'
  ) THEN
    CREATE POLICY "Users can read their own predictions"
      ON public.predictions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.get_public_question_prediction_summary(target_season integer DEFAULT NULL)
RETURNS TABLE (
  question_id uuid,
  prediction text,
  vote_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.question_id,
    lower(btrim(p.prediction)) AS prediction,
    count(*)::bigint AS vote_count
  FROM public.predictions p
  JOIN public.questions q ON q.id = p.question_id
  WHERE p.question_id IS NOT NULL
    AND (target_season IS NULL OR q.season = target_season)
  GROUP BY p.question_id, lower(btrim(p.prediction));
$$;

CREATE OR REPLACE FUNCTION public.get_question_confidence_sentiment(target_season integer DEFAULT NULL)
RETURNS TABLE (
  question_id uuid,
  meter_percent numeric,
  confidence_label text,
  sentiment_label text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH confidence_rollup AS (
    SELECT
      p.question_id,
      avg(
        CASE p.confidence
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
          ELSE NULL
        END
      ) AS avg_confidence
    FROM public.predictions p
    JOIN public.questions q ON q.id = p.question_id
    WHERE p.question_id IS NOT NULL
      AND (target_season IS NULL OR q.season = target_season)
    GROUP BY p.question_id
  )
  SELECT
    cr.question_id,
    round((((cr.avg_confidence - 1)::numeric / 2) * 100), 1) AS meter_percent,
    CASE
      WHEN cr.avg_confidence >= 2.4 THEN 'High'
      WHEN cr.avg_confidence >= 1.8 THEN 'Medium'
      ELSE 'Low'
    END AS confidence_label,
    CASE
      WHEN cr.avg_confidence >= 2.4 THEN 'High'
      WHEN cr.avg_confidence >= 1.8 THEN 'Medium'
      ELSE 'Low'
    END AS sentiment_label
  FROM confidence_rollup cr;
$$;

REVOKE ALL ON FUNCTION public.get_public_question_prediction_summary(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_question_confidence_sentiment(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_public_question_prediction_summary(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_question_confidence_sentiment(integer) TO anon, authenticated;
