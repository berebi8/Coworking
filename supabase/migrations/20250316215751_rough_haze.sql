/*
  # Add office type and update office ID format

  1. Changes
    - Add office_type enum with values 'office' and 'hot_desk'
    - Add office_type column to office_properties table
    - Update office_id format validation
*/

-- Create office type enum
CREATE TYPE office_type AS ENUM ('office', 'hot_desk');

-- Add office_type column to office_properties
ALTER TABLE office_properties 
  ADD COLUMN office_type office_type NOT NULL DEFAULT 'office';

-- Drop existing office_id constraint
ALTER TABLE office_properties
  DROP CONSTRAINT IF EXISTS office_properties_office_id_key;

-- Add new office_id constraint with format validation
ALTER TABLE office_properties
  ADD CONSTRAINT office_properties_office_id_key UNIQUE (office_id),
  ADD CONSTRAINT office_properties_office_id_format CHECK (
    (office_type = 'office' AND office_id ~ '^\d+/\d+$') OR
    (office_type = 'hot_desk' AND office_id ~ '^HD\d+[A-Z]$')
  );
