/*
  # Add Missing Agreement Fields

  1. Changes
    - Add notes field to agreement_office_spaces
    - Add notes field to agreement_parking_spaces
    - Add notes field to agreement_services
    - Add constraints to ensure proper data validation

  2. Data Migration
    - Set default values for new fields
*/

-- Add notes fields to all agreement-related tables
ALTER TABLE agreement_office_spaces
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE agreement_parking_spaces
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE agreement_services
  ADD COLUMN IF NOT EXISTS notes text;

-- Add constraints to ensure proper data validation
ALTER TABLE agreement_office_spaces
  ADD CONSTRAINT agreement_office_spaces_workstations_check CHECK (workstations > 0),
  ADD CONSTRAINT agreement_office_spaces_list_price_check CHECK (list_price >= 0),
  ADD CONSTRAINT agreement_office_spaces_discount_percentage_check CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  ADD CONSTRAINT agreement_office_spaces_fixed_term_price_check CHECK (fixed_term_price >= 0),
  ADD CONSTRAINT agreement_office_spaces_continuous_term_price_check CHECK (continuous_term_price >= 0);

ALTER TABLE agreement_parking_spaces
  ADD CONSTRAINT agreement_parking_spaces_list_price_check CHECK (list_price >= 0),
  ADD CONSTRAINT agreement_parking_spaces_discount_percentage_check CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  ADD CONSTRAINT agreement_parking_spaces_final_price_check CHECK (final_price >= 0);

ALTER TABLE agreement_services
  ADD CONSTRAINT agreement_services_list_price_check CHECK (list_price >= 0),
  ADD CONSTRAINT agreement_services_discount_percentage_check CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  ADD CONSTRAINT agreement_services_final_price_check CHECK (final_price >= 0);

-- Add constraints to agreements table for credit and deposit fields
ALTER TABLE agreements
  ADD CONSTRAINT agreements_conference_room_credits_check CHECK (conference_room_credits >= 0),
  ADD CONSTRAINT agreements_print_credits_bw_check CHECK (print_credits_bw >= 0),
  ADD CONSTRAINT agreements_print_credits_color_check CHECK (print_credits_color >= 0),
  ADD CONSTRAINT agreements_security_deposit_fixed_check CHECK (security_deposit_fixed >= 0),
  ADD CONSTRAINT agreements_security_deposit_continuous_check CHECK (security_deposit_continuous >= 0),
  ADD CONSTRAINT agreements_office_license_fees_total_check CHECK (office_license_fees_total >= 0),
  ADD CONSTRAINT agreements_monthly_payment_fixed_term_check CHECK (monthly_payment_fixed_term >= 0),
  ADD CONSTRAINT agreements_total_monthly_payment_check CHECK (total_monthly_payment >= 0),
  ADD CONSTRAINT agreements_parking_fees_total_check CHECK (parking_fees_total >= 0),
  ADD CONSTRAINT agreements_service_fees_total_check CHECK (service_fees_total >= 0);

-- Add constraints for credit overrides
ALTER TABLE agreements
  ADD CONSTRAINT agreements_conference_room_credits_override_check CHECK (conference_room_credits_override IS NULL OR conference_room_credits_override >= 0),
  ADD CONSTRAINT agreements_print_credits_bw_override_check CHECK (print_credits_bw_override IS NULL OR print_credits_bw_override >= 0),
  ADD CONSTRAINT agreements_print_credits_color_override_check CHECK (print_credits_color_override IS NULL OR print_credits_color_override >= 0),
  ADD CONSTRAINT agreements_security_deposit_fixed_override_check CHECK (security_deposit_fixed_override IS NULL OR security_deposit_fixed_override >= 0),
  ADD CONSTRAINT agreements_security_deposit_continuous_override_check CHECK (security_deposit_continuous_override IS NULL OR security_deposit_continuous_override >= 0);
