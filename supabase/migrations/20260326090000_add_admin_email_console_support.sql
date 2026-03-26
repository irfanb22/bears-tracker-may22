/*
  # Add admin email console support

  Why:
  - Admin needs a browser-based console to send test and production marketing emails.
  - The UI needs safe audience counts and recent send history.
  - Edge function sends should be logged for auditability.

  What this adds:
  - `public.current_user_is_admin()` helper
  - `public.email_send_logs` table
  - admin-only read access to send logs
  - `public.get_admin_email_audience_counts()` helper for dashboard counts
*/

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'email', '') = 'irfanbhanji@gmail.com';
$$;

CREATE TABLE IF NOT EXISTS public.email_send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('test', 'send')),
  segment text,
  test_email text,
  subject text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  status text NOT NULL CHECK (status IN ('started', 'succeeded', 'failed')),
  error_message text,
  payload_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_snapshot jsonb
);

ALTER TABLE public.email_send_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_send_logs'
      AND policyname = 'Admins can read email send logs'
  ) THEN
    CREATE POLICY "Admins can read email send logs"
      ON public.email_send_logs
      FOR SELECT
      TO authenticated
      USING (public.current_user_is_admin());
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS email_send_logs_created_at_idx
  ON public.email_send_logs (created_at DESC);

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
    COUNT(*) FILTER (
      WHERE ps.marketing_subscribed = true
        AND pu.user_id IS NOT NULL
    ) AS production_segment_count
  FROM preference_states ps
  LEFT JOIN prediction_users pu ON pu.user_id = ps.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_email_audience_counts() TO authenticated;
