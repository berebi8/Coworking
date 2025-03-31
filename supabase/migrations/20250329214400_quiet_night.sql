/*
  # Add override end date to termination notices

  1. Changes
    - Add override_end_date column
    - Add validation check for dates
    - Drop and recreate view with override information

  2. Security
    - No changes to RLS policies required
*/

-- First drop the existing view
DROP VIEW IF EXISTS termination_notices_view;

-- Add override_end_date column
ALTER TABLE termination_notices
  ADD COLUMN IF NOT EXISTS override_end_date date;

-- Add check constraint to ensure override date is not before notice date
ALTER TABLE termination_notices
  ADD CONSTRAINT termination_notices_date_check
  CHECK (
    override_end_date IS NULL OR 
    override_end_date >= notice_date
  );

-- Recreate the view with all columns including override information
CREATE VIEW termination_notices_view AS
SELECT 
  tn.*,
  au.username as recipient_username,
  c.commercial_name as client_name,
  CASE 
    WHEN tn.override_end_date IS NOT NULL THEN true
    ELSE false
  END as is_overridden
FROM termination_notices tn
LEFT JOIN app_users au ON au.id = tn.recipient_id
LEFT JOIN clients c ON c.company_id = tn.company_id;
