/*
  # Fix 2026 draft question deadline

  - Ensures the first 2026 draft prediction locks at 5:00 PM Central Time
    on April 23, 2026.
  - The original seed migration used `2026-04-23T13:00:00-05:00`, which is
    1:00 PM Central and does not match the intended lock time.
*/

UPDATE public.questions
SET deadline = '2026-04-23 17:00:00-05'
WHERE id = 'f6a8dc28-c6d7-4ba2-9492-437292ec0d2f';
