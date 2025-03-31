/*
  # Remove unique constraint on location names

  1. Changes
    - Remove unique constraint on `name` column in `locations` table
    - Keep unique constraint on `location_id` column
    - Add index on `name` column for better query performance

  2. Security
    - No changes to RLS policies
*/

-- Drop the unique constraint on the name column
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_name_key;

-- Create a non-unique index on name for better query performance
CREATE INDEX IF NOT EXISTS locations_name_idx ON locations (name);
