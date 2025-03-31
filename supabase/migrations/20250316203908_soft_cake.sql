/*
  # Add user status and implement soft delete

  1. Changes
    - Add status field to app_users table
    - Convert is_active to status enum
    - Add soft delete functionality
    - Update existing records

  2. Data Migration
    - Convert existing is_active values to new status
*/

-- Create the status enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'deleted');
  END IF;
END $$;

-- Add status column and convert existing is_active data
ALTER TABLE app_users 
  ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active';

-- Update existing records based on is_active
UPDATE app_users 
SET status = CASE 
  WHEN is_active = true THEN 'active'::user_status 
  ELSE 'inactive'::user_status 
END;

-- Drop the is_active column as it's replaced by status
ALTER TABLE app_users 
  DROP COLUMN IF EXISTS is_active;

-- Add deleted_at timestamp for soft delete
ALTER TABLE app_users 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Add masked_email column for storing hashed emails of deleted users
ALTER TABLE app_users 
  ADD COLUMN IF NOT EXISTS masked_email text DEFAULT NULL;
