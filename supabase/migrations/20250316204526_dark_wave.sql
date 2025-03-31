/*
  # Update email constraints for deleted users

  1. Changes
    - Make email column nullable
    - Update constraints to handle deleted users
    - Ensure data consistency for deleted users
*/

-- First make the email column nullable
ALTER TABLE app_users
  ALTER COLUMN email DROP NOT NULL;

-- Drop the existing email check constraint
ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_email_check;

-- Update data for deleted users
UPDATE app_users
SET masked_email = email,
    email = NULL
WHERE status = 'deleted' AND email IS NOT NULL;

-- Add the new constraint
ALTER TABLE app_users
  ADD CONSTRAINT app_users_email_check
  CHECK (
    (status = 'deleted' AND email IS NULL AND masked_email IS NOT NULL) OR
    (status != 'deleted' AND email IS NOT NULL)
  );
