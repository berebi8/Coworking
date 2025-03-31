/*
  # Complete Remaining Database Changes
  
  1. Changes
    - Create temporary function to update existing records
    - Add indexes for calculated numeric fields
    - Process all existing agreements
*/

-- Create temporary function for one-time update
CREATE OR REPLACE FUNCTION update_existing_agreements()
RETURNS void AS $$
DECLARE
  agreement_record RECORD;
BEGIN
  FOR agreement_record IN SELECT * FROM agreements LOOP
    -- Update the agreement to trigger the calculation function
    UPDATE agreements 
    SET updated_at = NOW()
    WHERE id = agreement_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT update_existing_agreements();

-- Drop the temporary function
DROP FUNCTION update_existing_agreements();

-- Add indexes for calculated numeric fields
CREATE INDEX IF NOT EXISTS idx_agreements_office_fees ON agreements (office_license_fees_total);
CREATE INDEX IF NOT EXISTS idx_agreements_parking_fees ON agreements (parking_fees_total);
CREATE INDEX IF NOT EXISTS idx_agreements_service_fees ON agreements (service_fees_total);
CREATE INDEX IF NOT EXISTS idx_agreements_monthly_payment ON agreements (monthly_payment_fixed_term);
CREATE INDEX IF NOT EXISTS idx_agreements_total_payment ON agreements (total_monthly_payment);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_agreements_type_status ON agreements (type, status);
CREATE INDEX IF NOT EXISTS idx_agreements_commercial_name ON agreements (commercial_name);
CREATE INDEX IF NOT EXISTS idx_agreements_start_date ON agreements (start_date);
