/*
  # Update agreements schema for new requirements

  1. Changes
    - Remove licensor_name field
    - Add payment method field
    - Add primary member information
    - Add invoicing details
    - Add fixed term flag
    - Add notice period current month flags
    - Add credit overrides
    - Add security deposit overrides
    - Add fee totals

  2. Data Migration
    - Set default values for new fields
    - Calculate fee totals from existing data
*/

-- Add new fields
ALTER TABLE agreements
  -- Remove licensor_name
  DROP COLUMN IF EXISTS licensor_name,
  
  -- Add payment method
  ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('standing_order', 'credit_card', 'bank_wire')),

  -- Add primary member information
  ADD COLUMN IF NOT EXISTS primary_member_name text,
  ADD COLUMN IF NOT EXISTS primary_member_title text,
  ADD COLUMN IF NOT EXISTS primary_member_phone text,
  ADD COLUMN IF NOT EXISTS primary_member_email text,

  -- Add invoicing details
  ADD COLUMN IF NOT EXISTS invoice_name text,
  ADD COLUMN IF NOT EXISTS invoice_email text,
  ADD COLUMN IF NOT EXISTS invoice_phone text,

  -- Add fixed term flag
  ADD COLUMN IF NOT EXISTS has_fixed_term boolean DEFAULT false,

  -- Add notice period current month flags
  ADD COLUMN IF NOT EXISTS notice_period_fixed_current_month boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notice_period_continuous_current_month boolean DEFAULT true,

  -- Add credit overrides
  ADD COLUMN IF NOT EXISTS conference_room_credits_override integer,
  ADD COLUMN IF NOT EXISTS print_credits_bw_override integer,
  ADD COLUMN IF NOT EXISTS print_credits_color_override integer,

  -- Add security deposit overrides
  ADD COLUMN IF NOT EXISTS security_deposit_fixed_override integer,
  ADD COLUMN IF NOT EXISTS security_deposit_continuous_override integer,

  -- Add fee totals
  ADD COLUMN IF NOT EXISTS parking_fees_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_fees_total integer NOT NULL DEFAULT 0;

-- Update existing records
UPDATE agreements
SET
  payment_method = 'standing_order',
  has_fixed_term = first_fixed_term_duration IS NOT NULL,
  notice_period_fixed_current_month = true,
  notice_period_continuous_current_month = true;

-- Calculate parking fees total
UPDATE agreements a
SET parking_fees_total = COALESCE(
  (
    SELECT SUM(final_price)
    FROM agreement_parking_spaces
    WHERE agreement_id = a.id
  ),
  0
);

-- Calculate service fees total
UPDATE agreements a
SET service_fees_total = COALESCE(
  (
    SELECT SUM(final_price)
    FROM agreement_services
    WHERE agreement_id = a.id
  ),
  0
);
