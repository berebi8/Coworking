/*
  # Add soft delete and status management to locations table

  1. Changes
    - Add status enum type for locations
    - Add status column to locations table
    - Add deleted_at timestamp for soft delete
    - Convert existing is_active boolean to status enum
    - Remove is_active column

  2. Data Migration
    - Convert existing is_active values to appropriate status values
*/

-- Create the location_status enum type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_status') THEN
    CREATE TYPE location_status AS ENUM ('active', 'inactive', 'deleted');
  END IF;
END $$;

-- Add status column and convert existing is_active data
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS status location_status NOT NULL DEFAULT 'active';

-- Update existing records based on is_active
UPDATE locations 
SET status = CASE 
  WHEN is_active = true THEN 'active'::location_status 
  ELSE 'inactive'::location_status 
END;

-- Drop the is_active column as it's replaced by status
ALTER TABLE locations 
  DROP COLUMN IF EXISTS is_active;

-- Add deleted_at timestamp for soft delete
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
