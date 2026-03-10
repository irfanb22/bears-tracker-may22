/*
  # Limit leaderboard to users with resolved predictions

  Problem:
  - Leaderboard currently includes all users from public.users, even if they
    have no resolved predictions in the selected season.

  Fix:
  - Keep users only when they have at least one resolved prediction for the
    requested season.
  - Preserve existing display_name -> email prefix -> Unknown User fallback.
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
  eligible_users AS (
    SELECT
      s.user_id,
      s.total_correct,
      s.resolved_predictions
    FROM scored s
    WHERE s.resolved_predictions > 0
  ),
  users_with_profile AS (
    SELECT
      eu.user_id,
      COALESCE(NULLIF(btrim(pu.display_name), ''), NULL) AS preferred_display_name,
      COALESCE(pu.email, au.email) AS email,
      eu.total_correct,
      eu.resolved_predictions
    FROM eligible_users eu
    LEFT JOIN public.users pu ON pu.id = eu.user_id
    LEFT JOIN auth.users au ON au.id = eu.user_id
  )
  SELECT
    rank() OVER (ORDER BY uwp.total_correct DESC) AS rank_position,
    COALESCE(
      uwp.preferred_display_name,
      NULLIF(btrim(split_part(uwp.email, '@', 1)), ''),
      'Unknown User'
    ) AS display_name,
    uwp.total_correct::integer AS total_correct,
    uwp.resolved_predictions::integer AS resolved_predictions,
    round((uwp.total_correct::numeric * 100.0) / uwp.resolved_predictions, 1) AS accuracy
  FROM users_with_profile uwp
  ORDER BY uwp.total_correct DESC, lower(COALESCE(uwp.preferred_display_name, uwp.email, 'Unknown User')) ASC;
$$;

REVOKE ALL ON FUNCTION public.get_season_leaderboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_season_leaderboard(integer) TO authenticated;
