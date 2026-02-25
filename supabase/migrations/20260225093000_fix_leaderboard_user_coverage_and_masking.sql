/*
  # Fix leaderboard user coverage and name masking

  1. Fix
    - Include users found in prediction data even if missing from public.users
    - Preserve all users from public.users with zero scores

  2. Privacy
    - Mask display names with asterisks (e.g. "irfanbhanji" -> "ir********")
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
  all_users AS (
    SELECT u.id AS user_id, u.email
    FROM public.users u
    UNION
    SELECT s.user_id, NULL::text AS email
    FROM scored s
  ),
  user_stats AS (
    SELECT
      au.user_id,
      CASE
        WHEN au.email IS NOT NULL AND btrim(au.email) <> '' THEN
          lower(left(split_part(au.email, '@', 1), 2)) ||
          repeat('*', GREATEST(length(split_part(au.email, '@', 1)) - 2, 2))
        ELSE
          'user**'
      END AS display_name,
      COALESCE(s.total_correct, 0)::integer AS total_correct,
      COALESCE(s.resolved_predictions, 0)::integer AS resolved_predictions
    FROM all_users au
    LEFT JOIN scored s ON s.user_id = au.user_id
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
