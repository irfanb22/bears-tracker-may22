/*
  # Enforce unique usernames (display_name)

  Goal:
  - Prevent two users from claiming the same username.
  - Enforce case-insensitive uniqueness.

  Notes:
  - NULL/blank display names are excluded so legacy accounts without usernames are unaffected.
  - If duplicates already exist, this migration will fail with a clear error.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE display_name IS NOT NULL
      AND btrim(display_name) <> ''
    GROUP BY lower(btrim(display_name))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce unique display_name: duplicate usernames already exist';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS users_display_name_unique_ci_idx
  ON public.users (lower(btrim(display_name)))
  WHERE display_name IS NOT NULL
    AND btrim(display_name) <> '';

