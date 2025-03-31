/*
  # Add client relationship to agreements table

  1. Changes
    - Add client_id column to agreements table
    - Add foreign key constraint to clients table
    - Add index for better query performance
    - Add trigger to automatically update/create client records

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Add client_id column if it doesn't exist
ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS agreements_client_id_idx ON agreements(client_id);

-- Create function to handle client upsert
CREATE OR REPLACE FUNCTION handle_agreement_client()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
BEGIN
  -- Check if client exists
  SELECT id INTO v_client_id
  FROM clients
  WHERE company_id = NEW.company_id;

  IF v_client_id IS NULL THEN
    -- Insert new client
    INSERT INTO clients (
      name,
      company_id,
      commercial_name,
      sap_number,
      primary_contact_name,
      primary_contact_email,
      primary_contact_phone,
      location,
      status
    ) VALUES (
      NEW.licensee_name,
      NEW.company_id,
      NEW.commercial_name,
      NEW.company_id, -- Using company_id as SAP number initially
      NEW.primary_member_name,
      NEW.primary_member_email,
      NEW.primary_member_phone,
      NEW.building,
      'active'
    )
    RETURNING id INTO v_client_id;
  ELSE
    -- Update existing client
    UPDATE clients
    SET
      name = NEW.licensee_name,
      commercial_name = NEW.commercial_name,
      primary_contact_name = COALESCE(NEW.primary_member_name, primary_contact_name),
      primary_contact_email = COALESCE(NEW.primary_member_email, primary_contact_email),
      primary_contact_phone = COALESCE(NEW.primary_member_phone, primary_contact_phone),
      location = COALESCE(NEW.building, location),
      updated_at = NOW()
    WHERE id = v_client_id;
  END IF;

  -- Set the client_id on the agreement
  NEW.client_id := v_client_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle client upsert
DROP TRIGGER IF EXISTS handle_agreement_client_trigger ON agreements;

CREATE TRIGGER handle_agreement_client_trigger
  BEFORE INSERT OR UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION handle_agreement_client();

-- Update existing agreements
WITH client_updates AS (
  SELECT DISTINCT ON (a.company_id)
    a.company_id,
    a.licensee_name,
    a.commercial_name,
    a.primary_member_name,
    a.primary_member_email,
    a.primary_member_phone,
    a.building,
    c.id as existing_client_id
  FROM agreements a
  LEFT JOIN clients c ON c.company_id = a.company_id
  WHERE a.company_id IS NOT NULL
  ORDER BY a.company_id, a.updated_at DESC
)
INSERT INTO clients (
  name,
  company_id,
  commercial_name,
  sap_number,
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  location,
  status
)
SELECT
  u.licensee_name,
  u.company_id,
  u.commercial_name,
  u.company_id, -- Using company_id as SAP number
  u.primary_member_name,
  u.primary_member_email,
  u.primary_member_phone,
  u.building,
  'active'
FROM client_updates u
WHERE u.existing_client_id IS NULL
ON CONFLICT (company_id) DO UPDATE
SET
  name = EXCLUDED.name,
  commercial_name = EXCLUDED.commercial_name,
  primary_contact_name = COALESCE(EXCLUDED.primary_contact_name, clients.primary_contact_name),
  primary_contact_email = COALESCE(EXCLUDED.primary_contact_email, clients.primary_contact_email),
  primary_contact_phone = COALESCE(EXCLUDED.primary_contact_phone, clients.primary_contact_phone),
  location = COALESCE(EXCLUDED.location, clients.location),
  updated_at = NOW();

-- Update client_id in agreements
UPDATE agreements a
SET client_id = c.id
FROM clients c
WHERE c.company_id = a.company_id
AND a.client_id IS NULL;
