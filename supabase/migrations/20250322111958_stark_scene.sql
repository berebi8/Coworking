/*
  # Add JSON columns to agreements table

  1. Changes
    - Add JSONB columns for office_spaces, parking_spaces, and services
    - Migrate existing data from relationship tables to JSON columns
    - Keep existing relationship tables for now

  2. Data Migration
    - Convert existing relationship data to JSON format
    - Set default empty arrays for new records
*/

-- Add JSON columns to agreements table
ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS office_spaces_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parking_spaces_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS services_json JSONB DEFAULT '[]'::jsonb;

-- Migrate existing office spaces data
UPDATE agreements a
SET office_spaces_json = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'office_id', os.office_id,
        'workstations', os.workstations,
        'list_price', os.list_price,
        'discount_percentage', os.discount_percentage,
        'special_discount_percentage', os.special_discount_percentage,
        'fixed_term_price', os.fixed_term_price,
        'continuous_term_price', os.continuous_term_price,
        'notes', os.notes
      )
    )
    FROM agreement_office_spaces os
    WHERE os.agreement_id = a.id
  ),
  '[]'::jsonb
);

-- Migrate existing parking spaces data
UPDATE agreements a
SET parking_spaces_json = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'parking_type', ps.parking_type,
        'list_price', ps.list_price,
        'quantity', ps.quantity,
        'discount_percentage', ps.discount_percentage,
        'final_price', ps.final_price,
        'notes', ps.notes
      )
    )
    FROM agreement_parking_spaces ps
    WHERE ps.agreement_id = a.id
  ),
  '[]'::jsonb
);

-- Migrate existing services data
UPDATE agreements a
SET services_json = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'service_id', s.service_id,
        'type', s.type,
        'list_price', s.list_price,
        'quantity', s.quantity,
        'discount_percentage', s.discount_percentage,
        'final_price', s.final_price,
        'notes', s.notes
      )
    )
    FROM agreement_services s
    WHERE s.agreement_id = a.id
  ),
  '[]'::jsonb
);
