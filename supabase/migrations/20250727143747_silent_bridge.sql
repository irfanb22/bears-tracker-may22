/*
  # Add 2025 Chicago Bears Schedule

  1. New Data
    - Insert all 17 games for the 2025 Chicago Bears season
    - Includes opponent, date, and location (Home/Away)
    - Proper timestamp formatting for all dates

  2. Security
    - No changes to security policies
    - Uses existing games table structure
*/

-- Insert 2025 Chicago Bears schedule (17 games)
INSERT INTO games (opponent, date, location) VALUES
  ('Minnesota Vikings', '2025-09-08 19:15:00-05'::timestamptz, 'Away'),     -- Week 1: Mon 09/09/2025 (adjusted for Central Time)
  ('Detroit Lions', '2025-09-14 12:00:00-05'::timestamptz, 'Away'),         -- Week 2: Sun 09/14/2025
  ('Dallas Cowboys', '2025-09-21 12:00:00-05'::timestamptz, 'Home'),        -- Week 3: Sun 09/21/2025
  ('Las Vegas Raiders', '2025-09-28 12:00:00-05'::timestamptz, 'Home'),     -- Week 4: Sun 09/28/2025
  ('Washington Commanders', '2025-10-13 19:15:00-05'::timestamptz, 'Home'), -- Week 6: Mon 10/13/2025
  ('New Orleans Saints', '2025-10-19 12:00:00-05'::timestamptz, 'Away'),    -- Week 7: Sun 10/19/2025
  ('Baltimore Ravens', '2025-10-26 12:00:00-05'::timestamptz, 'Away'),      -- Week 8: Sun 10/26/2025
  ('Cincinnati Bengals', '2025-11-02 12:00:00-06'::timestamptz, 'Away'),    -- Week 9: Sun 11/02/2025 (DST ends)
  ('New York Giants', '2025-11-09 12:00:00-06'::timestamptz, 'Home'),       -- Week 10: Sun 11/09/2025
  ('Minnesota Vikings', '2025-11-16 12:00:00-06'::timestamptz, 'Home'),     -- Week 11: Sun 11/16/2025
  ('Pittsburgh Steelers', '2025-11-23 12:00:00-06'::timestamptz, 'Away'),   -- Week 12: Sun 11/23/2025
  ('Philadelphia Eagles', '2025-11-28 15:30:00-06'::timestamptz, 'Away'),   -- Week 13: Fri 11/28/2025 (Thanksgiving)
  ('Green Bay Packers', '2025-12-07 12:00:00-06'::timestamptz, 'Home'),     -- Week 14: Sun 12/07/2025
  ('Cleveland Browns', '2025-12-14 12:00:00-06'::timestamptz, 'Away'),      -- Week 15: Sun 12/14/2025
  ('Green Bay Packers', '2025-12-22 12:00:00-06'::timestamptz, 'Away'),     -- Week 16: TBD (using 12/22/2025)
  ('San Francisco 49ers', '2025-12-28 12:00:00-06'::timestamptz, 'Away'),   -- Week 17: Sun 12/28/2025
  ('Detroit Lions', '2026-01-05 12:00:00-06'::timestamptz, 'Home');         -- Week 18: TBD (using 01/05/2026)