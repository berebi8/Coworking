/*
  # Fix Credit Override Handling

  1. Changes
    - Drop view temporarily to allow column modifications
    - Convert override fields to integer
    - Update main values where overrides exist
    - Convert empty strings to NULL
    - Recreate view with proper handling

  2. Data Migration
    - Ensure override values properly update main values
    - Fix null handling for override fields
*/

-- First drop the view to allow column modifications
DROP VIEW IF EXISTS agreement_calculated_view;

-- Convert override fields to integer
ALTER TABLE agreements 
  ALTER COLUMN print_credits_bw_override TYPE integer USING print_credits_bw_override::integer,
  ALTER COLUMN print_credits_color_override TYPE integer USING print_credits_color_override::integer,
  ALTER COLUMN conference_room_credits_override TYPE integer USING conference_room_credits_override::integer;

-- Update main values where overrides exist
UPDATE agreements 
SET conference_room_credits = conference_room_credits_override
WHERE conference_room_credits_override IS NOT NULL;

UPDATE agreements 
SET print_credits_bw = print_credits_bw_override
WHERE print_credits_bw_override IS NOT NULL;

UPDATE agreements 
SET print_credits_color = print_credits_color_override
WHERE print_credits_color_override IS NOT NULL;

-- Convert empty strings to NULL
UPDATE agreements
SET print_credits_bw_override = NULL
WHERE print_credits_bw_override::text = '';

UPDATE agreements
SET print_credits_color_override = NULL
WHERE print_credits_color_override::text = '';

UPDATE agreements
SET conference_room_credits_override = NULL
WHERE conference_room_credits_override::text = '';

-- Recreate the view
CREATE OR REPLACE VIEW agreement_calculated_view AS
WITH agreement_data AS (
  SELECT 
    agreements.*,
    -- Extract and sort office spaces
    (
      SELECT jsonb_agg(office ORDER BY 
        CASE WHEN agreements.has_fixed_term THEN agreements.start_date ELSE agreements.continuous_term_start_date END,
        office->>'office_id'
      )
      FROM jsonb_array_elements(COALESCE(agreements.office_spaces, '[]'::jsonb)) office
    ) AS sorted_office_spaces,
    
    -- Extract parking spaces
    (
      SELECT jsonb_agg(space ORDER BY space->>'parking_type')
      FROM jsonb_array_elements(COALESCE(agreements.parking_spaces, '[]'::jsonb)) space
    ) AS sorted_parking_spaces,
    
    -- Extract add-on services (excluding credits)
    (
      SELECT jsonb_agg(service ORDER BY service->>'type', service->>'name')
      FROM jsonb_array_elements(COALESCE(agreements.services, '[]'::jsonb)) service
      WHERE service->>'type' NOT IN ('credits_mr', 'credits_print')
    ) AS sorted_services,
    
    -- Extract credits (once per agreement)
    jsonb_build_object(
      'conference_room_credits', COALESCE(agreements.conference_room_credits, 0),
      'print_credits_bw', COALESCE(agreements.print_credits_bw, 0),
      'print_credits_color', COALESCE(agreements.print_credits_color, 0)
    ) AS credits_summary
  FROM agreements
)
SELECT 
  d.*,
  
  -- Generate line items in correct order
  (
    SELECT jsonb_agg(line_item ORDER BY 
      CASE 
        -- Offices first, sorted by date
        WHEN line_item->>'type' = 'Office' THEN 1
        -- Then parking
        WHEN line_item->>'type' = 'Parking' THEN 2
        -- Then add-on services
        WHEN line_item->>'type' = 'Service' THEN 3
        -- Finally credits
        WHEN line_item->>'type' = 'Credits' THEN 4
        ELSE 5
      END,
      -- Secondary sort by start date and name
      COALESCE(line_item->>'start_date', '9999-12-31'),
      line_item->>'name'
    )
    FROM (
      -- Office spaces (both fixed and continuous terms)
      SELECT jsonb_build_object(
        'type', 'Office',
        'name', office->>'office_id',
        'start_date', 
          CASE 
            WHEN d.has_fixed_term THEN d.start_date::text
            ELSE d.continuous_term_start_date::text
          END,
        'end_date', 
          CASE 
            WHEN d.has_fixed_term THEN d.first_fixed_term_end_date::text
            ELSE NULL
          END,
        'list_price', office->>'list_price',
        'discount_percentage', 
          COALESCE((office->>'discount_percentage')::numeric, 0) +
          COALESCE((office->>'special_discount_percentage')::numeric, 0),
        'final_price',
          CASE 
            WHEN d.has_fixed_term THEN office->>'fixed_term_price'
            ELSE office->>'continuous_term_price'
          END,
        'term_type',
          CASE 
            WHEN d.has_fixed_term THEN 'Fixed Term'
            ELSE 'Continuous Term'
          END
      ) as line_item
      FROM jsonb_array_elements(d.sorted_office_spaces) office
      
      UNION ALL
      
      -- Parking spaces
      SELECT jsonb_build_object(
        'type', 'Parking',
        'name', space->>'parking_type',
        'start_date', d.start_date::text,
        'list_price', space->>'list_price',
        'quantity', space->>'quantity',
        'discount_percentage', space->>'discount_percentage',
        'final_price', space->>'final_price'
      ) as line_item
      FROM jsonb_array_elements(d.sorted_parking_spaces) space
      
      UNION ALL
      
      -- Add-on services
      SELECT jsonb_build_object(
        'type', 'Service',
        'name', service->>'name',
        'start_date', d.start_date::text,
        'list_price', service->>'list_price',
        'quantity', service->>'quantity',
        'discount_percentage', service->>'discount_percentage',
        'final_price', service->>'final_price'
      ) as line_item
      FROM jsonb_array_elements(d.sorted_services) service
      
      UNION ALL
      
      -- Credits (once per agreement)
      SELECT jsonb_build_object(
        'type', 'Credits',
        'name', credit_type,
        'start_date', d.start_date::text,
        'quantity', credit_value,
        'list_price', 0,
        'discount_percentage', 0,
        'final_price', 0
      ) as line_item
      FROM (
        VALUES 
          ('Meeting Room Credits', COALESCE((d.credits_summary->>'conference_room_credits')::integer, 0)),
          ('B&W Print Credits', COALESCE((d.credits_summary->>'print_credits_bw')::integer, 0)),
          ('Color Print Credits', COALESCE((d.credits_summary->>'print_credits_color')::integer, 0))
      ) as credits(credit_type, credit_value)
      WHERE credit_value > 0  -- Only show credits with non-zero values
    ) items
  ) as calculated_line_items

FROM agreement_data d;
