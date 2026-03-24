/*
  # Add email preferences for app-managed unsubscribe

  Why:
  - Product emails (recaps, reminders, updates) need a first-party unsubscribe system.
  - Supabase should be the source of truth for who receives future emails.

  What this adds:
  - `public.email_preferences` table keyed by `user_id`
  - default `marketing_subscribed = true`
  - timestamps for unsubscribe / last update
  - RLS so authenticated users can view/update only their own preference row
  - trigger to create a default preference row for new auth users
  - backfill for existing users
*/

CREATE TABLE IF NOT EXISTS public.email_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  marketing_subscribed boolean NOT NULL DEFAULT true,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unsubscribed_at_matches_subscription
    CHECK (
      (marketing_subscribed = true AND unsubscribed_at IS NULL)
      OR marketing_subscribed = false
    )
);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_preferences'
      AND policyname = 'Users can read own email preferences'
  ) THEN
    CREATE POLICY "Users can read own email preferences"
      ON public.email_preferences
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_preferences'
      AND policyname = 'Users can update own email preferences'
  ) THEN
    CREATE POLICY "Users can update own email preferences"
      ON public.email_preferences
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_preferences'
      AND policyname = 'Users can insert own email preferences'
  ) THEN
    CREATE POLICY "Users can insert own email preferences"
      ON public.email_preferences
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_email_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_email_preferences_updated_at ON public.email_preferences;
CREATE TRIGGER set_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_email_preferences_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_email_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_email_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_email_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_email_preferences();

INSERT INTO public.email_preferences (user_id)
SELECT u.id
FROM public.users u
LEFT JOIN public.email_preferences ep ON ep.user_id = u.id
WHERE ep.user_id IS NULL;
