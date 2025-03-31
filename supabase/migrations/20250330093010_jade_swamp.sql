/*
  # Update agreement view with client information

  1. Changes
    - Drop existing view
    - Create new view that includes client information
    - Add calculated fields for better data presentation
    - Improve sorting and filtering capabilities

  2. Security
    - Maintain existing RLS policies
    - Ensure proper data access control
*/

-- Drop existing view
DROP VIEW IF EXISTS agreement_calculated_view;

-- Create updated view with client information
CREATE OR REPLACE VIEW agreement_calculated_view AS
WITH agreement_data AS (
  SELECT 
    a.*,
    c.name as client_name,
    c.sap_number as client_sap_number,
    c.primary_contact_name as client_contact_name,
    c.primary_contact_email as client_contact_email,
    c.primary_contact_phone as client_contact_phone,
    c.location as client_location,
    c.status as client_status,
    -- Extract and sort office spaces
    (
      SELECT jsonb_agg(office ORDER BY 
        CASE WHEN a.has_fixed_term THEN a.start_date ELSE a.continuous_term_start_date END,
        office->>'office_id'
      )
      FROM jsonb_array_elements(COALESCE(a.office_spaces, '[]'::jsonb)) office
    ) AS sorted_office_spaces,
    
    -- Extract parking spaces
    (
      SELECT jsonb_agg(space ORDER BY space->>'parking_type')
      FROM jsonb_array_elements(COALESCE(a.parking_spaces, '[]'::jsonb)) space
    ) AS sorted_parking_spaces,
    
    -- Extract add-on services
    (
      SELECT jsonb_agg(service ORDER BY service->>'type', service->>'name')
      FROM jsonb_array_elements(COALESCE(a.services, '[]'::jsonb)) service
      WHERE service->>'type' NOT IN ('credits_mr', 'credits_print')
    ) AS sorted_services,
    
    -- Extract credits summary
    jsonb_build_object(
      'conference_room_credits', COALESCE(a.conference_room_credits, 0),
      'print_credits_bw', COALESCE(a.print_credits_bw, 0),
      'print_credits_color', COALESCE(a.print_credits_color, 0),
      'has_overrides', (
        a.conference_room_credits_override IS NOT NULL OR
        a.print_credits_bw_override IS NOT NULL OR
        a.print_credits_color_override IS NOT NULL
      )
    ) AS credits_summary
  FROM agreements a
  LEFT JOIN clients c ON c.id = a.client_id
)
SELECT 
  d.*,
  
  -- Generate line items in correct order
  (
    SELECT jsonb_agg(line_item ORDER BY 
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
      WHERE credit_value > 0
    ) items
  ) as calculated_line_items

FROM agreement_data d;
