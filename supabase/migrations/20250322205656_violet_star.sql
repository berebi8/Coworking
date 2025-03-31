/*
  # Fix agreement deletion cascade

  1. Changes
    - Add ON DELETE CASCADE to all foreign key constraints
    - Ensure proper cleanup of related records

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- Drop existing foreign key constraints
ALTER TABLE agreement_office_spaces
  DROP CONSTRAINT IF EXISTS agreement_office_spaces_agreement_id_fkey;

ALTER TABLE agreement_parking_spaces
  DROP CONSTRAINT IF EXISTS agreement_parking_spaces_agreement_id_fkey;

ALTER TABLE agreement_services
  DROP CONSTRAINT IF EXISTS agreement_services_agreement_id_fkey;

-- Recreate constraints with CASCADE
ALTER TABLE agreement_office_spaces
  ADD CONSTRAINT agreement_office_spaces_agreement_id_fkey
  FOREIGN KEY (agreement_id)
  REFERENCES agreements(id)
  ON DELETE CASCADE;

ALTER TABLE agreement_parking_spaces
  ADD CONSTRAINT agreement_parking_spaces_agreement_id_fkey
  FOREIGN KEY (agreement_id)
  REFERENCES agreements(id)
  ON DELETE CASCADE;

ALTER TABLE agreement_services
  ADD CONSTRAINT agreement_services_agreement_id_fkey
  FOREIGN KEY (agreement_id)
  REFERENCES agreements(id)
  ON DELETE CASCADE;

-- Add delete policy for agreements
CREATE POLICY "Enable delete for authenticated users"
  ON agreements
  FOR DELETE
  TO authenticated
  USING (true);
