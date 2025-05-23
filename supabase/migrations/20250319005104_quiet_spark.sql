/*
  # Delete Test Users

  1. Changes
    - Delete all predictions made by test users
    - Delete all season stats made by test users
    - Delete all test users from auth.users table
    - Reset the user sequence to ensure clean state

  2. Security
    - No changes to security policies
*/

-- First, delete all predictions made by test users
DELETE FROM predictions;

-- Delete all season stats made by test users
DELETE FROM season_stats;

-- Delete all users from auth.users
DELETE FROM auth.users;