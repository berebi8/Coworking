/*
  # Add JSON columns to agreements table

  1. Changes
    - Add office_spaces_json column as JSONB
    - Add parking_spaces_json column as JSONB
    - Add services_json column as JSONB
    - Drop related tables since data will be stored in JSON

  2. Data Migration
    - Convert existing data to JSON format
    - Store in new columns
    - Drop old tables after migration
*/

-- First, migrate existing data to JSON columns
ALTER TABLE agreements
  ADD COLUMN office_spaces_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN parking_spaces_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN services_json JSONB DEFAULT '[]'::jsonb;

-- Migrate office spaces data
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

-- Migrate parking spaces data
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

-- Migrate services data
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

-- Drop the old tables
DROP TABLE IF EXISTS agreement_services;
DROP TABLE IF EXISTS agreement_parking_spaces;
DROP TABLE IF EXISTS agreement_office_spaces;
