/*
  # Fix termination notices foreign key constraint

  1. Changes
    - Create unique index on clients.company_id
    - Drop and recreate foreign key constraint
    - Update view to handle new relationship

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- First drop the existing view
DROP VIEW IF EXISTS termination_notices_view;

-- Drop the existing constraints
ALTER TABLE termination_notices
  DROP CONSTRAINT IF EXISTS termination_notices_date_check,
  DROP CONSTRAINT IF EXISTS termination_notices_company_id_fkey;

-- Add override_end_date column if it doesn't exist
ALTER TABLE termination_notices
  ADD COLUMN IF NOT EXISTS override_end_date date;

-- Add check constraint to ensure override date is not before notice date
ALTER TABLE termination_notices
  ADD CONSTRAINT termination_notices_date_check
  CHECK (
    override_end_date IS NULL OR 
    override_end_date >= notice_date
  );

-- Create unique index on clients.company_id
CREATE UNIQUE INDEX IF NOT EXISTS clients_company_id_key 
ON clients (company_id);

-- Add foreign key constraint to clients table
ALTER TABLE termination_notices
  ADD CONSTRAINT termination_notices_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES clients(company_id);

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
