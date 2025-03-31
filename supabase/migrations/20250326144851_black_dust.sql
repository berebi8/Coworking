/*
  # Create calculated view for agreements

  1. Changes
    - Create a view that always calculates prices
    - Handle null values and type conversions
    - Provide fallback calculations
*/

CREATE OR REPLACE VIEW agreement_calculated_view AS
SELECT 
  a.*,
  -- Calculated office spaces
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'office_id', office->>'office_id',
        'workstations', COALESCE((office->>'workstations')::integer, 1),
        'list_price', COALESCE((office->>'list_price')::numeric, 0),
        'discount_percentage', COALESCE((office->>'discount_percentage')::numeric, 0),
        'special_discount_percentage', COALESCE((office->>'special_discount_percentage')::numeric, 0),
        'fixed_term_price', COALESCE(
          (office->>'fixed_term_price')::numeric,
          ROUND(
            COALESCE((office->>'list_price')::numeric, 0) * 
            (1 - (COALESCE((office->>'discount_percentage')::numeric, 0) + 
                  COALESCE((office->>'special_discount_percentage')::numeric, 0)) / 100),
            2
          )
        ),
        'continuous_term_price', COALESCE(
          (office->>'continuous_term_price')::numeric,
          (office->>'list_price')::numeric,
          0
        )
      )
    )
    FROM jsonb_array_elements(COALESCE(a.office_spaces, '[]'::jsonb)) office
  ) AS calculated_office_spaces,
  
  -- Calculated parking spaces
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'parking_type', space->>'parking_type',
        'list_price', COALESCE((space->>'list_price')::numeric, 0),
        'quantity', COALESCE((space->>'quantity')::integer, 1),
        'discount_percentage', COALESCE((space->>'discount_percentage')::numeric, 0),
        'final_price', COALESCE(
          (space->>'final_price')::numeric,
          ROUND(
            COALESCE((space->>'list_price')::numeric, 0) * 
            COALESCE((space->>'quantity')::integer, 1) * 
            (1 - COALESCE((space->>'discount_percentage')::numeric, 0) / 100),
            2
          )
        )
      )
    )
    FROM jsonb_array_elements(COALESCE(a.parking_spaces, '[]'::jsonb)) space
  ) AS calculated_parking_spaces,
  
  -- Calculated services
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', service->>'type',
        'service_id', service->>'service_id',
        'list_price', COALESCE((service->>'list_price')::numeric, 0),
        'quantity', COALESCE((service->>'quantity')::integer, 1),
        'discount_percentage', COALESCE((service->>'discount_percentage')::numeric, 0),
        'final_price', COALESCE(
          (service->>'final_price')::numeric,
          ROUND(
            COALESCE((service->>'list_price')::numeric, 0) * 
            COALESCE((service->>'quantity')::integer, 1) * 
            (1 - COALESCE((service->>'discount_percentage')::numeric, 0) / 100),
            2
          )
        )
      )
    )
    FROM jsonb_array_elements(COALESCE(a.services, '[]'::jsonb)) service
  ) AS calculated_services,
  
  -- Calculated totals
  COALESCE(
    a.office_license_fees_total,
    (
      SELECT SUM(
        CASE WHEN a.has_fixed_term THEN
          COALESCE((office->>'fixed_term_price')::numeric,
            ROUND(
              COALESCE((office->>'list_price')::numeric, 0) * 
              (1 - (COALESCE((office->>'discount_percentage')::numeric, 0) + 
                    COALESCE((office->>'special_discount_percentage')::numeric, 0)) / 100),
              2
            )
          )
        ELSE
          COALESCE((office->>'continuous_term_price')::numeric,
            COALESCE((office->>'list_price')::numeric, 0)
          )
        END
      )
      FROM jsonb_array_elements(COALESCE(a.office_spaces, '[]'::jsonb)) office
    ),
    0
  ) AS calculated_office_fees,
  
  COALESCE(
    a.parking_fees_total,
    (
      SELECT SUM(
        COALESCE((space->>'final_price')::numeric,
          ROUND(
            COALESCE((space->>'list_price')::numeric, 0) * 
            COALESCE((space->>'quantity')::integer, 1) * 
            (1 - COALESCE((space->>'discount_percentage')::numeric, 0) / 100),
            2
          )
        )
      )
      FROM jsonb_array_elements(COALESCE(a.parking_spaces, '[]'::jsonb)) space
    ),
    0
  ) AS calculated_parking_fees,
  
  COALESCE(
    a.service_fees_total,
    (
      SELECT SUM(
        COALESCE((service->>'final_price')::numeric,
          ROUND(
            COALESCE((service->>'list_price')::numeric, 0) * 
            COALESCE((service->>'quantity')::integer, 1) * 
            (1 - COALESCE((service->>'discount_percentage')::numeric, 0) / 100),
            2
          )
        )
      )
      FROM jsonb_array_elements(COALESCE(a.services, '[]'::jsonb)) service
    ),
    0
  ) AS calculated_service_fees
  
FROM agreements a;
