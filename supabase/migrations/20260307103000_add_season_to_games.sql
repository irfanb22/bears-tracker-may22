/*
  # Add explicit season to games

  1. Changes
    - Add `season` column to `games`
    - Backfill existing rows from `games.date`
      - Jul-Dec => same calendar year
      - Jan-Jun => previous calendar year (NFL season rollover)
    - Enforce NOT NULL and season validity
    - Add index for season filtering
*/

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS season integer;

UPDATE public.games
SET season = CASE
  WHEN EXTRACT(MONTH FROM date) >= 7 THEN EXTRACT(YEAR FROM date)::integer
  ELSE (EXTRACT(YEAR FROM date)::integer - 1)
END
WHERE season IS NULL;

ALTER TABLE public.games
ALTER COLUMN season SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'games_season_check'
  ) THEN
    ALTER TABLE public.games
    ADD CONSTRAINT games_season_check CHECK (season >= 2024);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_games_season
ON public.games(season);
