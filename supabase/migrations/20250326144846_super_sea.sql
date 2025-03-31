/*
  # Add NUMERIC columns to agreements table

  1. Changes
    - Add NUMERIC columns for fee totals if they don't exist
    - Convert existing columns to NUMERIC type if needed
    - Set default values to 0
*/

-- Add or modify columns to ensure NUMERIC type
ALTER TABLE agreements
  ALTER COLUMN office_license_fees_total TYPE NUMERIC USING office_license_fees_total::numeric,
  ALTER COLUMN office_license_fees_total SET DEFAULT 0,
  ALTER COLUMN parking_fees_total TYPE NUMERIC USING parking_fees_total::numeric,
  ALTER COLUMN parking_fees_total SET DEFAULT 0,
  ALTER COLUMN service_fees_total TYPE NUMERIC USING service_fees_total::numeric,
  ALTER COLUMN service_fees_total SET DEFAULT 0,
  ALTER COLUMN monthly_payment_fixed_term TYPE NUMERIC USING monthly_payment_fixed_term::numeric,
  ALTER COLUMN monthly_payment_fixed_term SET DEFAULT 0,
  ALTER COLUMN total_monthly_payment TYPE NUMERIC USING total_monthly_payment::numeric,
  ALTER COLUMN total_monthly_payment SET DEFAULT 0;
