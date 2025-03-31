/*
  # Fix email uniqueness handling

  1. Changes
    - Drop existing email uniqueness constraint
    - Add new partial unique index that excludes deleted users
    - Add check constraint to ensure email or masked_email is not null
*/

-- Drop the existing email uniqueness constraint
ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_email_key;

-- Create a partial unique index that only applies to non-deleted users
CREATE UNIQUE INDEX app_users_email_unique_active 
  ON app_users (email)
  WHERE status != 'deleted';

-- Add constraint to ensure either email or masked_email is present
ALTER TABLE app_users
  ADD CONSTRAINT app_users_email_check
  CHECK (
    (status = 'deleted' AND masked_email IS NOT NULL) OR
    (status != 'deleted' AND email IS NOT NULL)
  );
