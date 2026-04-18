/*
  # Count all subscribed users for admin email sends

  Why:
  - Draft reminder emails should go to all existing subscribed users, not only users with predictions.
  - The admin email console should show counts that match the actual production send segment.
*/

CREATE OR REPLACE FUNCTION public.get_admin_email_audience_counts()
RETURNS TABLE (
  subscribed_total bigint,
  subscribed_with_predictions bigint,
  unsubscribed_total bigint,
  production_segment_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  WITH prediction_users AS (
    SELECT DISTINCT p.user_id
    FROM public.predictions p
    WHERE p.question_id IS NOT NULL
  ),
  preference_states AS (
    SELECT
      ep.user_id,
      ep.marketing_subscribed
    FROM public.email_preferences ep
  )
  SELECT
    COUNT(*) FILTER (WHERE ps.marketing_subscribed = true) AS subscribed_total,
    COUNT(*) FILTER (
      WHERE ps.marketing_subscribed = true
        AND pu.user_id IS NOT NULL
    ) AS subscribed_with_predictions,
    COUNT(*) FILTER (WHERE ps.marketing_subscribed = false) AS unsubscribed_total,
    COUNT(*) FILTER (WHERE ps.marketing_subscribed = true) AS production_segment_count
  FROM preference_states ps
  LEFT JOIN prediction_users pu ON pu.user_id = ps.user_id;
END;
$$;
