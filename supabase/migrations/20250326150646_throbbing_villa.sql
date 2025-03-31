/*
  # Fix data migration with renamed variables

  1. Changes
    - Rename variables to avoid column name conflicts
    - Add proper null handling for JSONB fields
    - Improve JSONB array handling
    - Add explicit type casting
*/

-- Create temporary function for one-time update with renamed variables
CREATE OR REPLACE FUNCTION update_existing_agreements()
RETURNS void AS $$
DECLARE
  agreement_record RECORD;
  updated_office_spaces JSONB;
  updated_parking_spaces JSONB;
  updated_services JSONB;
  calc_office_fees NUMERIC := 0;
  calc_parking_fees NUMERIC := 0;
  calc_service_fees NUMERIC := 0;
  office_space JSONB;
  parking_space JSONB;
  service_item JSONB;
  total_discount NUMERIC;
BEGIN
  FOR agreement_record IN SELECT * FROM agreements LOOP
    -- Reset totals for each agreement
    calc_office_fees := 0;
    calc_parking_fees := 0;
    calc_service_fees := 0;
    
    -- Process office spaces
    IF agreement_record.office_spaces IS NOT NULL AND jsonb_array_length(agreement_record.office_spaces) > 0 THEN
      updated_office_spaces := '[]'::jsonb;
      
      FOR i IN 0..jsonb_array_length(agreement_record.office_spaces) - 1 LOOP
        office_space := agreement_record.office_spaces->i;
        
        -- Ensure numeric fields are properly set
        IF office_space->>'list_price' IS NULL OR office_space->>'list_price' = '' THEN
          office_space := jsonb_set(office_space, '{list_price}', '0');
        END IF;
        
        IF office_space->>'discount_percentage' IS NULL OR office_space->>'discount_percentage' = '' THEN
          office_space := jsonb_set(office_space, '{discount_percentage}', '0');
        END IF;
        
        IF office_space->>'special_discount_percentage' IS NULL OR office_space->>'special_discount_percentage' = '' THEN
          office_space := jsonb_set(office_space, '{special_discount_percentage}', '0');
        END IF;
        
        -- Calculate total discount
        total_discount := (CAST(office_space->>'discount_percentage' AS NUMERIC) + 
                         COALESCE(CAST(office_space->>'special_discount_percentage' AS NUMERIC), 0));
        
        -- Calculate fixed_term_price
        office_space := jsonb_set(
          office_space, 
          '{fixed_term_price}', 
          to_jsonb(
            ROUND(
              CAST(office_space->>'list_price' AS NUMERIC) * (1 - total_discount / 100),
              2
            )
          )
        );
        
        -- Set continuous_term_price (list price without discount)
        office_space := jsonb_set(
          office_space, 
          '{continuous_term_price}', 
          to_jsonb(CAST(office_space->>'list_price' AS NUMERIC))
        );
        
        -- Add to updated array
        updated_office_spaces := updated_office_spaces || office_space;
        
        -- Add to total
        calc_office_fees := calc_office_fees + CAST(office_space->>'fixed_term_price' AS NUMERIC);
      END LOOP;
    ELSE
      updated_office_spaces := NULL;
    END IF;
    
    -- Process parking spaces
    IF agreement_record.parking_spaces IS NOT NULL AND jsonb_array_length(agreement_record.parking_spaces) > 0 THEN
      updated_parking_spaces := '[]'::jsonb;
      
      FOR i IN 0..jsonb_array_length(agreement_record.parking_spaces) - 1 LOOP
        parking_space := agreement_record.parking_spaces->i;
        
        -- Ensure numeric fields are properly set
        IF parking_space->>'list_price' IS NULL OR parking_space->>'list_price' = '' THEN
          parking_space := jsonb_set(parking_space, '{list_price}', '0');
        END IF;
        
        IF parking_space->>'discount_percentage' IS NULL OR parking_space->>'discount_percentage' = '' THEN
          parking_space := jsonb_set(parking_space, '{discount_percentage}', '0');
        END IF;
        
        IF parking_space->>'quantity' IS NULL OR parking_space->>'quantity' = '' THEN
          parking_space := jsonb_set(parking_space, '{quantity}', '1');
        END IF;
        
        -- Calculate final_price
        parking_space := jsonb_set(
          parking_space, 
          '{final_price}', 
          to_jsonb(
            ROUND(
              CAST(parking_space->>'list_price' AS NUMERIC) * 
              CAST(parking_space->>'quantity' AS NUMERIC) * 
              (1 - CAST(parking_space->>'discount_percentage' AS NUMERIC) / 100),
              2
            )
          )
        );
        
        -- Add to updated array
        updated_parking_spaces := updated_parking_spaces || parking_space;
        
        -- Add to total
        calc_parking_fees := calc_parking_fees + CAST(parking_space->>'final_price' AS NUMERIC);
      END LOOP;
    ELSE
      updated_parking_spaces := NULL;
    END IF;
    
    -- Process services
    IF agreement_record.services IS NOT NULL AND jsonb_array_length(agreement_record.services) > 0 THEN
      updated_services := '[]'::jsonb;
      
      FOR i IN 0..jsonb_array_length(agreement_record.services) - 1 LOOP
        service_item := agreement_record.services->i;
        
        -- Ensure numeric fields are properly set
        IF service_item->>'list_price' IS NULL OR service_item->>'list_price' = '' THEN
          service_item := jsonb_set(service_item, '{list_price}', '0');
        END IF;
        
        IF service_item->>'discount_percentage' IS NULL OR service_item->>'discount_percentage' = '' THEN
          service_item := jsonb_set(service_item, '{discount_percentage}', '0');
        END IF;
        
        IF service_item->>'quantity' IS NULL OR service_item->>'quantity' = '' THEN
          service_item := jsonb_set(service_item, '{quantity}', '1');
        END IF;
        
        -- Calculate final_price
        service_item := jsonb_set(
          service_item, 
          '{final_price}', 
          to_jsonb(
            ROUND(
              CAST(service_item->>'list_price' AS NUMERIC) * 
              CAST(service_item->>'quantity' AS NUMERIC) * 
              (1 - CAST(service_item->>'discount_percentage' AS NUMERIC) / 100),
              2
            )
          )
        );
        
        -- Add to updated array
        updated_services := updated_services || service_item;
        
        -- Add to total
        calc_service_fees := calc_service_fees + CAST(service_item->>'final_price' AS NUMERIC);
      END LOOP;
    ELSE
      updated_services := NULL;
    END IF;
    
    -- Update the agreement with renamed variables to avoid ambiguity
    UPDATE agreements SET 
      office_spaces = COALESCE(updated_office_spaces, office_spaces),
      parking_spaces = COALESCE(updated_parking_spaces, parking_spaces),
      services = COALESCE(updated_services, services),
      office_license_fees_total = calc_office_fees,
      parking_fees_total = calc_parking_fees,
      service_fees_total = calc_service_fees,
      monthly_payment_fixed_term = calc_office_fees + calc_parking_fees + calc_service_fees,
      total_monthly_payment = calc_office_fees + calc_parking_fees + calc_service_fees,
      updated_at = NOW()
    WHERE id = agreement_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT update_existing_agreements();

-- Drop the temporary function
DROP FUNCTION update_existing_agreements();
