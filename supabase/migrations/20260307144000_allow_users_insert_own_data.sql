/*
  # Allow users to create their own profile row

  Why:
  - Some legacy accounts may be missing a row in public.users.
  - Dashboard username save falls back to upsert, which requires INSERT permission.

  Effect:
  - Authenticated users can insert only their own row (id = auth.uid()).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can insert own data'
  ) THEN
    CREATE POLICY "Users can insert own data"
      ON public.users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;
