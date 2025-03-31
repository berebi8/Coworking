/*
  # Fix credit fields and calculations

  1. Changes
    - Cast override fields to integer with proper NULL handling
    - Ensure default fields are integers
    - Set default values for NULL fields
    - Propagate override values correctly
    - Recalculate credits from office_spaces
*/

-- First drop the view to avoid conflicts
DROP VIEW IF EXISTS agreement_calculated_view;

-- Explicitly cast override values to integer with proper NULL handling
ALTER TABLE agreements 
  ALTER COLUMN print_credits_bw_override TYPE integer USING CASE 
    WHEN print_credits_bw_override::text = '' THEN NULL 
    ELSE print_credits_bw_override::integer 
  END,
  ALTER COLUMN print_credits_color_override TYPE integer USING CASE 
    WHEN print_credits_color_override::text = '' THEN NULL 
    ELSE print_credits_color_override::integer 
  END,
  ALTER COLUMN conference_room_credits_override TYPE integer USING CASE 
    WHEN conference_room_credits_override::text = '' THEN NULL 
    ELSE conference_room_credits_override::integer 
  END;

-- Make sure default fields are also integers
ALTER TABLE agreements 
  ALTER COLUMN print_credits_bw TYPE integer USING COALESCE(print_credits_bw::integer, 0),
  ALTER COLUMN print_credits_color TYPE integer USING COALESCE(print_credits_color::integer, 0),
  ALTER COLUMN conference_room_credits TYPE integer USING COALESCE(conference_room_credits::integer, 0);

-- Set default values for NULL fields
UPDATE agreements
SET print_credits_bw = 0
WHERE print_credits_bw IS NULL;

UPDATE agreements
SET print_credits_color = 0
WHERE print_credits_color IS NULL;

UPDATE agreements
SET conference_room_credits = 0
WHERE conference_room_credits IS NULL;

-- Ensure all override values propagate correctly
UPDATE agreements 
SET conference_room_credits = conference_room_credits_override
WHERE conference_room_credits_override IS NOT NULL;

UPDATE agreements 
SET print_credits_bw = print_credits_bw_override
WHERE print_credits_bw_override IS NOT NULL;

UPDATE agreements 
SET print_credits_color = print_credits_color_override
WHERE print_credits_color_override IS NOT NULL;

-- Recalculate credits from office_spaces for agreements without overrides
WITH office_credits AS (
  SELECT 
    a.id,
    SUM(COALESCE((o->>'mr_credits')::integer, 0)) AS total_mr_credits,
    SUM(COALESCE((o->>'print_quota_bw')::integer, 0)) AS total_print_bw,
    SUM(COALESCE((o->>'print_quota_color')::integer, 0)) AS total_print_color
  FROM 
    agreements a,
    jsonb_array_elements(a.office_spaces) o
  GROUP BY 
    a.id
)
UPDATE agreements a
SET 
  conference_room_credits = CASE 
    WHEN a.conference_room_credits_override IS NULL 
    THEN GREATEST(oc.total_mr_credits, 0)
    ELSE a.conference_room_credits
  END,
  print_credits_bw = CASE 
    WHEN a.print_credits_bw_override IS NULL 
    THEN GREATEST(oc.total_print_bw, 0)
    ELSE a.print_credits_bw
  END,
  print_credits_color = CASE 
    WHEN a.print_credits_color_override IS NULL 
    THEN GREATEST(oc.total_print_color, 0)
    ELSE a.print_credits_color
  END
FROM office_credits oc
WHERE a.id = oc.id;

-- Add constraints to ensure non-negative values
ALTER TABLE agreements
  ADD CONSTRAINT check_credits_non_negative 
  CHECK (
    conference_room_credits >= 0 AND
    print_credits_bw >= 0 AND
    print_credits_color >= 0
  );

-- Add constraints for override values
ALTER TABLE agreements
  ADD CONSTRAINT check_credits_override_non_negative 
  CHECK (
    (conference_room_credits_override IS NULL OR conference_room_credits_override >= 0) AND
    (print_credits_bw_override IS NULL OR print_credits_bw_override >= 0) AND
    (print_credits_color_override IS NULL OR print_credits_color_override >= 0)
  );

-- Recreate the view
CREATE OR REPLACE VIEW agreement_calculated_view AS
WITH agreement_data AS (
  SELECT 
    agreements.*,
    (SELECT jsonb_agg(office ORDER BY 
      CASE WHEN agreements.has_fixed_term THEN agreements.start_date ELSE agreements.continuous_term_start_date END,
      office->>'office_id'
    )
    FROM jsonb_array_elements(COALESCE(agreements.office_spaces, '[]'::jsonb)) office
    ) AS sorted_office_spaces,
    
    (SELECT jsonb_agg(space ORDER BY space->>'parking_type')
    FROM jsonb_array_elements(COALESCE(agreements.parking_spaces, '[]'::jsonb)) space
    ) AS sorted_parking_spaces,
    
    (SELECT jsonb_agg(service ORDER BY service->>'type', service->>'name')
    FROM jsonb_array_elements(COALESCE(agreements.services, '[]'::jsonb)) service
    WHERE service->>'type' NOT IN ('credits_mr', 'credits_print')
    ) AS sorted_services,
    
    jsonb_build_object(
      'conference_room_credits', COALESCE(agreements.conference_room_credits, 0),
      'print_credits_bw', COALESCE(agreements.print_credits_bw, 0),
      'print_credits_color', COALESCE(agreements.print_credits_color, 0)
    ) AS credits_summary
  FROM agreements
)
SELECT 
  d.*,
  (SELECT jsonb_agg(line_item ORDER BY 
    CASE 
      WHEN line_item->>'type' = 'Office' THEN 1
      WHEN line_item->>'type' = 'Parking' THEN 2
      WHEN line_item->>'type' = 'Service' THEN 3
      WHEN line_item->>'type' = 'Credits' THEN 4
      ELSE 5
    END,
    COALESCE(line_item->>'start_date', '9999-12-31'),
    line_item->>'name'
  )
  FROM (
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
    WHERE credit_value > 0
  ) items
) as calculated_line_items
FROM agreement_data d;
