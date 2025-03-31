/*
  # Fix termination notices relationships

  1. Changes
    - Drop and recreate foreign key constraints with proper references
    - Add indexes for better query performance
    - Update RLS policies to handle relationships

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Drop existing foreign key constraints
ALTER TABLE termination_notices
  DROP CONSTRAINT IF EXISTS termination_notices_recipient_id_fkey,
  DROP CONSTRAINT IF EXISTS termination_notices_created_by_fkey,
  DROP CONSTRAINT IF EXISTS termination_notices_updated_by_fkey;

-- Add new foreign key constraints with proper references
ALTER TABLE termination_notices
  ADD CONSTRAINT termination_notices_recipient_id_fkey 
    FOREIGN KEY (recipient_id) REFERENCES app_users(id),
  ADD CONSTRAINT termination_notices_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES app_users(id),
  ADD CONSTRAINT termination_notices_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES app_users(id);

-- Create indexes for better join performance
CREATE INDEX IF NOT EXISTS termination_notices_recipient_id_idx 
  ON termination_notices(recipient_id);
CREATE INDEX IF NOT EXISTS termination_notices_created_by_idx 
  ON termination_notices(created_by);
CREATE INDEX IF NOT EXISTS termination_notices_updated_by_idx 
  ON termination_notices(updated_by);

-- Update the query in the TerminationNoticesManagement component
CREATE OR REPLACE VIEW termination_notices_view AS
SELECT 
  tn.*,
  au.username as recipient_username,
  c.commercial_name as client_name
FROM termination_notices tn
LEFT JOIN app_users au ON au.id = tn.recipient_id
LEFT JOIN clients c ON c.company_id = tn.company_id;
