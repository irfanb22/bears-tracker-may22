/*
  # 2026 Bears game picks

  Additive rollout for the season-wide game picker.

  - The season starts in `draft`, so only admins can test against production data.
  - Every choice autosaves, but a forecast is scoring-eligible only after all 17
    games have been picked before the shared Week 1 deadline.
  - Each correct game pick is worth one point. There is no confidence value and
    no bonus for matching the final regular-season record.
*/

CREATE TABLE IF NOT EXISTS public.game_pick_seasons (
  season integer PRIMARY KEY,
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft', 'open', 'locked')),
  lock_at timestamptz NOT NULL,
  total_games integer NOT NULL DEFAULT 17 CHECK (total_games > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_pick_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season integer NOT NULL REFERENCES public.game_pick_seasons(season) ON DELETE CASCADE,
  week integer NOT NULL CHECK (week BETWEEN 1 AND 18),
  opponent text NOT NULL,
  short_name text NOT NULL,
  logo_code text NOT NULL,
  home boolean NOT NULL,
  kickoff_at timestamptz,
  date_label text NOT NULL,
  time_label text NOT NULL,
  location text NOT NULL,
  spotlight text,
  winner text CHECK (winner IN ('bears', 'opponent')),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season, week)
);

CREATE TABLE IF NOT EXISTS public.game_picks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.game_pick_games(id) ON DELETE CASCADE,
  pick text NOT NULL CHECK (pick IN ('bears', 'opponent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS public.game_pick_forecasts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season integer NOT NULL REFERENCES public.game_pick_seasons(season) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, season)
);

CREATE INDEX IF NOT EXISTS game_pick_games_season_week_idx
  ON public.game_pick_games(season, week);

CREATE INDEX IF NOT EXISTS game_picks_game_id_idx
  ON public.game_picks(game_id);

INSERT INTO public.game_pick_seasons (season, state, lock_at, total_games)
VALUES (2026, 'draft', '2026-09-13 12:00:00 America/Chicago', 17)
ON CONFLICT (season) DO UPDATE
SET lock_at = EXCLUDED.lock_at,
    total_games = EXCLUDED.total_games,
    updated_at = now();

INSERT INTO public.game_pick_games
  (season, week, opponent, short_name, logo_code, home, kickoff_at, date_label, time_label, location, spotlight)
VALUES
  (2026, 1,  'Carolina Panthers',      'CAR', 'car', false, '2026-09-13 12:00:00 America/Chicago', 'Sep 13', '12:00 PM', 'Charlotte, NC',  null),
  (2026, 2,  'Minnesota Vikings',      'MIN', 'min', true,  '2026-09-20 12:00:00 America/Chicago', 'Sep 20', '12:00 PM', 'Soldier Field',  null),
  (2026, 3,  'Philadelphia Eagles',    'PHI', 'phi', true,  '2026-09-28 19:15:00 America/Chicago', 'Sep 28', '7:15 PM',  'Soldier Field',  'MNF'),
  (2026, 4,  'New York Jets',          'NYJ', 'nyj', true,  '2026-10-04 12:00:00 America/Chicago', 'Oct 4',  '12:00 PM', 'Soldier Field',  null),
  (2026, 5,  'Green Bay Packers',      'GB',  'gb',  false, '2026-10-11 15:25:00 America/Chicago', 'Oct 11', '3:25 PM',  'Green Bay, WI',  'Rivalry'),
  (2026, 6,  'Atlanta Falcons',        'ATL', 'atl', false, '2026-10-18 12:00:00 America/Chicago', 'Oct 18', '12:00 PM', 'Atlanta, GA',    null),
  (2026, 7,  'New England Patriots',   'NE',  'ne',  true,  '2026-10-22 19:15:00 America/Chicago', 'Oct 22', '7:15 PM',  'Soldier Field',  'TNF'),
  (2026, 8,  'Seattle Seahawks',       'SEA', 'sea', false, '2026-11-02 19:15:00 America/Chicago', 'Nov 2',  '7:15 PM',  'Seattle, WA',    'MNF'),
  (2026, 9,  'Tampa Bay Buccaneers',  'TB',  'tb',  true,  '2026-11-08 19:20:00 America/Chicago', 'Nov 8',  '7:20 PM',  'Soldier Field',  'SNF'),
  (2026, 11, 'New Orleans Saints',     'NO',  'no',  true,  '2026-11-22 12:00:00 America/Chicago', 'Nov 22', '12:00 PM', 'Soldier Field',  null),
  (2026, 12, 'Detroit Lions',          'DET', 'det', false, '2026-11-26 12:00:00 America/Chicago', 'Nov 26', '12:00 PM', 'Detroit, MI',    'Thanksgiving'),
  (2026, 13, 'Jacksonville Jaguars',   'JAX', 'jax', true,  '2026-12-06 12:00:00 America/Chicago', 'Dec 6',  '12:00 PM', 'Soldier Field',  null),
  (2026, 14, 'Miami Dolphins',         'MIA', 'mia', false, '2026-12-13 12:00:00 America/Chicago', 'Dec 13', '12:00 PM', 'Miami, FL',      null),
  (2026, 15, 'Buffalo Bills',          'BUF', 'buf', false, '2026-12-19 19:20:00 America/Chicago', 'Dec 19', '7:20 PM',  'Buffalo, NY',    null),
  (2026, 16, 'Green Bay Packers',      'GB',  'gb',  true,  '2026-12-25 12:00:00 America/Chicago', 'Dec 25', '12:00 PM', 'Soldier Field',  'Christmas'),
  (2026, 17, 'Detroit Lions',          'DET', 'det', true,  '2027-01-03 15:25:00 America/Chicago', 'Jan 3',  '3:25 PM',  'Soldier Field',  null),
  (2026, 18, 'Minnesota Vikings',      'MIN', 'min', false, null,                                  'TBD',    'TBD',      'Minneapolis, MN', null)
ON CONFLICT (season, week) DO UPDATE
SET opponent = EXCLUDED.opponent,
    short_name = EXCLUDED.short_name,
    logo_code = EXCLUDED.logo_code,
    home = EXCLUDED.home,
    kickoff_at = EXCLUDED.kickoff_at,
    date_label = EXCLUDED.date_label,
    time_label = EXCLUDED.time_label,
    location = EXCLUDED.location,
    spotlight = EXCLUDED.spotlight,
    updated_at = now();

ALTER TABLE public.game_pick_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_pick_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_pick_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Game pick season status is public" ON public.game_pick_seasons;
CREATE POLICY "Game pick season status is public"
  ON public.game_pick_seasons FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage game pick seasons" ON public.game_pick_seasons;
CREATE POLICY "Admins manage game pick seasons"
  ON public.game_pick_seasons FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Available game pick schedules are readable" ON public.game_pick_games;
CREATE POLICY "Available game pick schedules are readable"
  ON public.game_pick_games FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.game_pick_seasons s
      WHERE s.season = game_pick_games.season
        AND (s.state IN ('open', 'locked') OR public.current_user_is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage game results" ON public.game_pick_games;
CREATE POLICY "Admins manage game results"
  ON public.game_pick_games FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Users read their own game picks" ON public.game_picks;
CREATE POLICY "Users read their own game picks"
  ON public.game_picks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read their own game forecast" ON public.game_pick_forecasts;
CREATE POLICY "Users read their own game forecast"
  ON public.game_pick_forecasts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_game_pick_season_status(target_season integer DEFAULT 2026)
RETURNS TABLE (
  season integer,
  state text,
  lock_at timestamptz,
  total_games integer,
  can_access boolean,
  can_edit boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.season,
    CASE WHEN now() >= s.lock_at THEN 'locked' ELSE s.state END AS state,
    s.lock_at,
    s.total_games,
    (s.state IN ('open', 'locked') OR now() >= s.lock_at OR public.current_user_is_admin()) AS can_access,
    (
      now() < s.lock_at
      AND (s.state = 'open' OR (s.state = 'draft' AND public.current_user_is_admin()))
    ) AS can_edit
  FROM public.game_pick_seasons s
  WHERE s.season = target_season;
$$;

CREATE OR REPLACE FUNCTION public.save_game_pick(target_game_id uuid, target_pick text)
RETURNS TABLE (
  picked_count integer,
  total_games integer,
  forecast_complete boolean,
  completed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  game_season integer;
  season_row public.game_pick_seasons%ROWTYPE;
  saved_count integer;
  saved_completed_at timestamptz;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to save game picks';
  END IF;

  IF target_pick NOT IN ('bears', 'opponent') THEN
    RAISE EXCEPTION 'Invalid game pick';
  END IF;

  SELECT g.season INTO game_season
  FROM public.game_pick_games g
  WHERE g.id = target_game_id;

  IF game_season IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  SELECT * INTO season_row
  FROM public.game_pick_seasons s
  WHERE s.season = game_season
  FOR UPDATE;

  IF now() >= season_row.lock_at OR season_row.state = 'locked' THEN
    RAISE EXCEPTION 'All game picks are locked';
  END IF;

  IF season_row.state <> 'open'
     AND NOT (season_row.state = 'draft' AND public.current_user_is_admin()) THEN
    RAISE EXCEPTION 'Game picks are not open yet';
  END IF;

  INSERT INTO public.game_picks (user_id, game_id, pick)
  VALUES (current_user_id, target_game_id, target_pick)
  ON CONFLICT (user_id, game_id) DO UPDATE
  SET pick = EXCLUDED.pick,
      updated_at = now();

  SELECT count(*)::integer INTO saved_count
  FROM public.game_picks p
  JOIN public.game_pick_games g ON g.id = p.game_id
  WHERE p.user_id = current_user_id
    AND g.season = game_season;

  IF saved_count = season_row.total_games THEN
    INSERT INTO public.game_pick_forecasts (user_id, season, completed_at)
    VALUES (current_user_id, game_season, now())
    ON CONFLICT (user_id, season) DO UPDATE
    SET updated_at = now()
    RETURNING game_pick_forecasts.completed_at INTO saved_completed_at;
  ELSE
    SELECT f.completed_at INTO saved_completed_at
    FROM public.game_pick_forecasts f
    WHERE f.user_id = current_user_id
      AND f.season = game_season;
  END IF;

  RETURN QUERY
  SELECT
    saved_count,
    season_row.total_games,
    saved_count = season_row.total_games,
    saved_completed_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_game_pick_result(target_game_id uuid, target_winner text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF target_winner IS NOT NULL AND target_winner NOT IN ('bears', 'opponent') THEN
    RAISE EXCEPTION 'Invalid game result';
  END IF;

  UPDATE public.game_pick_games
  SET winner = target_winner,
      resolved_at = CASE WHEN target_winner IS NULL THEN NULL ELSE now() END,
      updated_at = now()
  WHERE id = target_game_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_game_pick_season_state(target_season integer, target_state text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF target_state NOT IN ('draft', 'open', 'locked') THEN
    RAISE EXCEPTION 'Invalid season state';
  END IF;

  UPDATE public.game_pick_seasons
  SET state = target_state,
      updated_at = now()
  WHERE season = target_season;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game pick season not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_season_leaderboard(target_season integer DEFAULT 2025)
RETURNS TABLE (
  rank_position bigint,
  display_name text,
  total_correct integer,
  resolved_predictions integer,
  accuracy numeric(5,1)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_question_predictions AS (
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
  question_scores AS (
    SELECT
      lqp.user_id,
      count(*) FILTER (
        WHERE lqp.correct_answer IS NOT NULL AND btrim(lqp.correct_answer) <> ''
      )::integer AS resolved_count,
      count(*) FILTER (
        WHERE lqp.correct_answer IS NOT NULL
          AND btrim(lqp.correct_answer) <> ''
          AND lower(btrim(lqp.prediction)) = lower(btrim(lqp.correct_answer))
      )::integer AS correct_count
    FROM latest_question_predictions lqp
    WHERE lqp.rn = 1
    GROUP BY lqp.user_id
  ),
  eligible_game_users AS (
    SELECT p.user_id
    FROM public.game_picks p
    JOIN public.game_pick_games g ON g.id = p.game_id
    JOIN public.game_pick_seasons s ON s.season = g.season
    WHERE g.season = target_season
    GROUP BY p.user_id, s.total_games
    HAVING count(*) = s.total_games
  ),
  game_scores AS (
    SELECT
      egu.user_id,
      count(*) FILTER (WHERE g.winner IS NOT NULL)::integer AS resolved_count,
      count(*) FILTER (WHERE g.winner IS NOT NULL AND p.pick = g.winner)::integer AS correct_count
    FROM eligible_game_users egu
    JOIN public.game_picks p ON p.user_id = egu.user_id
    JOIN public.game_pick_games g ON g.id = p.game_id AND g.season = target_season
    GROUP BY egu.user_id
  ),
  combined_scores AS (
    SELECT
      ids.user_id,
      (COALESCE(qs.correct_count, 0) + COALESCE(gs.correct_count, 0))::integer AS total_correct,
      (COALESCE(qs.resolved_count, 0) + COALESCE(gs.resolved_count, 0))::integer AS resolved_predictions
    FROM (
      SELECT user_id FROM question_scores
      UNION
      SELECT user_id FROM game_scores
    ) ids
    LEFT JOIN question_scores qs ON qs.user_id = ids.user_id
    LEFT JOIN game_scores gs ON gs.user_id = ids.user_id
  ),
  users_with_profile AS (
    SELECT
      cs.user_id,
      COALESCE(NULLIF(btrim(pu.display_name), ''), NULL) AS preferred_display_name,
      COALESCE(pu.email, au.email) AS email,
      cs.total_correct,
      cs.resolved_predictions
    FROM combined_scores cs
    LEFT JOIN public.users pu ON pu.id = cs.user_id
    LEFT JOIN auth.users au ON au.id = cs.user_id
    WHERE cs.resolved_predictions > 0
  )
  SELECT
    rank() OVER (ORDER BY uwp.total_correct DESC) AS rank_position,
    COALESCE(
      uwp.preferred_display_name,
      NULLIF(btrim(split_part(uwp.email, '@', 1)), ''),
      'Unknown User'
    ) AS display_name,
    uwp.total_correct,
    uwp.resolved_predictions,
    round((uwp.total_correct::numeric * 100.0) / uwp.resolved_predictions, 1) AS accuracy
  FROM users_with_profile uwp
  ORDER BY uwp.total_correct DESC,
    lower(COALESCE(uwp.preferred_display_name, uwp.email, 'Unknown User')) ASC;
$$;

REVOKE ALL ON FUNCTION public.get_game_pick_season_status(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_game_pick(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_game_pick_result(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_game_pick_season_state(integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_season_leaderboard(integer) FROM PUBLIC;

GRANT SELECT ON public.game_pick_seasons TO anon, authenticated;
GRANT SELECT ON public.game_pick_games, public.game_picks, public.game_pick_forecasts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_game_pick_season_status(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_game_pick(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_game_pick_result(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_game_pick_season_state(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_season_leaderboard(integer) TO authenticated;
