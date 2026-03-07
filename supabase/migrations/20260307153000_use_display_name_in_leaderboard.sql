/*
  # Use display_name in season leaderboard (email-prefix fallback)

  Problem:
  - The current leaderboard function masks email for every user and does not
    surface public.users.display_name.

  Fix:
  - Use users.display_name when present.
  - Fall back to email prefix (before '@') when display_name is missing/blank.
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
    JOIN public.questions q ON q.id::text = p.question_id::text
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
  all_user_ids AS (
    SELECT u.id AS user_id
    FROM public.users u
    UNION
    SELECT s.user_id
    FROM scored s
  ),
  users_with_profile AS (
    SELECT
      aui.user_id,
      NULLIF(btrim(pu.display_name), '') AS display_name,
      COALESCE(pu.email, au.email) AS email
    FROM all_user_ids aui
    LEFT JOIN public.users pu ON pu.id = aui.user_id
    LEFT JOIN auth.users au ON au.id = aui.user_id
  ),
  user_stats AS (
    SELECT
      uwp.user_id,
      COALESCE(
        uwp.display_name,
        NULLIF(btrim(split_part(uwp.email, '@', 1)), ''),
        'Unknown User'
      ) AS display_name,
      COALESCE(s.total_correct, 0)::integer AS total_correct,
      COALESCE(s.resolved_predictions, 0)::integer AS resolved_predictions
    FROM users_with_profile uwp
    LEFT JOIN scored s ON s.user_id = uwp.user_id
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
  ORDER BY us.total_correct DESC, lower(us.display_name) ASC;
$$;

REVOKE ALL ON FUNCTION public.get_season_leaderboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_season_leaderboard(integer) TO authenticated;
