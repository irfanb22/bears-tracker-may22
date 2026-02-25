/*
  # Harden function grants for security definer/internal functions

  Restricts direct execution of internal functions from PUBLIC.
*/

DO $$
BEGIN
  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC';
  END IF;

  IF to_regprocedure('public.update_prediction_points()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.update_prediction_points() FROM PUBLIC';
  END IF;

  IF to_regprocedure('public.calculate_prediction_points(text,text,public.confidence_level,integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.calculate_prediction_points(text,text,public.confidence_level,integer) FROM PUBLIC';
  END IF;

  IF to_regprocedure('public.recalculate_season_prediction_scores(integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.recalculate_season_prediction_scores(integer) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.recalculate_season_prediction_scores(integer) TO service_role';
  END IF;

  IF to_regprocedure('public.get_season_leaderboard(integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.get_season_leaderboard(integer) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_season_leaderboard(integer) TO authenticated';
  END IF;
END $$;
