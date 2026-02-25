/*
  # Add season leaderboard function

  1. Purpose
    - Returns leaderboard rows for a given season (default 2025)
    - Ranks by total correct predictions
    - Uses competition ranking for ties (1, 1, 3)

  2. Privacy
    - Returns display names derived from email local-part only
    - Does not return full email addresses
*/

CREATE OR REPLACE FUNCTION public.get_season_leaderboard(target_season integer DEFAULT 2025)
RETURNS TABLE (
  rank_position bigint,
  display_name text,
  total_correct integer,
  resolved_predictions integer,
  accuracy numeric(5,1)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_predictions AS (
    SELECT
      p.user_id,
      p.question_id,
      p.prediction,
      q.correct_answer,
      row_number() OVER (
        PARTITION BY p.user_id, p.question_id
        ORDER BY p.created_at DESC, p.id DESC
      ) AS rn
    FROM public.predictions p
    JOIN public.questions q ON q.id = p.question_id
    WHERE q.season = target_season
  ),
  scored AS (
    SELECT
      lp.user_id,
      COUNT(*) FILTER (
        WHERE lp.correct_answer IS NOT NULL
          AND btrim(lp.correct_answer) <> ''
      )::integer AS resolved_predictions,
      COUNT(*) FILTER (
        WHERE lp.correct_answer IS NOT NULL
          AND btrim(lp.correct_answer) <> ''
          AND lower(btrim(lp.prediction)) = lower(btrim(lp.correct_answer))
      )::integer AS total_correct
    FROM latest_predictions lp
    WHERE lp.rn = 1
    GROUP BY lp.user_id
  ),
  user_stats AS (
    SELECT
      u.id AS user_id,
      replace(
        initcap(regexp_replace(split_part(u.email, '@', 1), '[^a-zA-Z0-9]+', ' ', 'g')),
        ' ',
        ''
      ) AS display_name,
      COALESCE(s.total_correct, 0)::integer AS total_correct,
      COALESCE(s.resolved_predictions, 0)::integer AS resolved_predictions
    FROM public.users u
    LEFT JOIN scored s ON s.user_id = u.id
  )
  SELECT
    rank() OVER (ORDER BY us.total_correct DESC) AS rank_position,
    us.display_name,
    us.total_correct,
    us.resolved_predictions,
    CASE
      WHEN us.resolved_predictions > 0
        THEN round((us.total_correct::numeric * 100.0) / us.resolved_predictions, 1)
      ELSE 0.0
    END AS accuracy
  FROM user_stats us
  ORDER BY us.total_correct DESC, us.display_name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_season_leaderboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_season_leaderboard(integer) TO authenticated;
