/*
  # Fix termination notices foreign key relationship

  1. Changes
    - Drop and recreate foreign key to reference app_users instead of auth.users
    - Maintain existing data and constraints
    - Update indexes for better query performance

  2. Security
    - Maintain RLS policies
    - Ensure proper access control
*/

-- Drop existing foreign key constraints if they exist
ALTER TABLE termination_notices
  DROP CONSTRAINT IF EXISTS termination_notices_recipient_id_fkey,
  DROP CONSTRAINT IF EXISTS termination_notices_created_by_fkey,
  DROP CONSTRAINT IF EXISTS termination_notices_updated_by_fkey;

-- Add new foreign key constraints
ALTER TABLE termination_notices
  ADD CONSTRAINT termination_notices_recipient_id_fkey 
    FOREIGN KEY (recipient_id) REFERENCES app_users(id),
  ADD CONSTRAINT termination_notices_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES app_users(id),
  ADD CONSTRAINT termination_notices_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES app_users(id);

-- Create indexes for foreign keys if they don't exist
CREATE INDEX IF NOT EXISTS termination_notices_recipient_id_idx 
  ON termination_notices(recipient_id);
CREATE INDEX IF NOT EXISTS termination_notices_created_by_idx 
  ON termination_notices(created_by);
CREATE INDEX IF NOT EXISTS termination_notices_updated_by_idx 
  ON termination_notices(updated_by);
