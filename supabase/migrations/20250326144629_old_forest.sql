/*
  # Fix Agreement Calculations

  1. Changes
    - Add function to calculate prices for JSONB fields
    - Add trigger to automatically calculate prices on insert/update
    - Add indexes for better JSONB querying performance
    - Add validation checks for numeric fields

  2. Data Migration
    - Update existing records with calculated prices
    - Ensure all JSONB fields have proper structure
*/

-- Create function to calculate prices for office spaces
CREATE OR REPLACE FUNCTION calculate_office_space_prices(office_space JSONB)
RETURNS JSONB AS $$
DECLARE
  list_price NUMERIC;
  discount_percentage NUMERIC;
  special_discount_percentage NUMERIC;
  total_discount NUMERIC;
  fixed_term_price NUMERIC;
  continuous_term_price NUMERIC;
BEGIN
  -- Extract and validate numeric values
  list_price := COALESCE((office_space->>'list_price')::NUMERIC, 0);
  discount_percentage := COALESCE((office_space->>'discount_percentage')::NUMERIC, 0);
  special_discount_percentage := COALESCE((office_space->>'special_discount_percentage')::NUMERIC, 0);
  
  -- Calculate total discount and prices
  total_discount := discount_percentage + special_discount_percentage;
  fixed_term_price := ROUND(list_price * (1 - total_discount / 100), 2);
  continuous_term_price := list_price;
  
  -- Return updated office space object
  RETURN jsonb_set(
    jsonb_set(
      office_space,
      '{fixed_term_price}',
      to_jsonb(fixed_term_price)
    ),
    '{continuous_term_price}',
    to_jsonb(continuous_term_price)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to calculate prices for parking spaces
CREATE OR REPLACE FUNCTION calculate_parking_space_prices(parking_space JSONB)
RETURNS JSONB AS $$
DECLARE
  list_price NUMERIC;
  discount_percentage NUMERIC;
  quantity INTEGER;
  final_price NUMERIC;
BEGIN
  -- Extract and validate numeric values
  list_price := COALESCE((parking_space->>'list_price')::NUMERIC, 0);
  discount_percentage := COALESCE((parking_space->>'discount_percentage')::NUMERIC, 0);
  quantity := COALESCE((parking_space->>'quantity')::INTEGER, 1);
  
  -- Calculate final price
  final_price := ROUND(list_price * quantity * (1 - discount_percentage / 100), 2);
  
  -- Return updated parking space object
  RETURN jsonb_set(
    parking_space,
    '{final_price}',
    to_jsonb(final_price)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to calculate prices for services
CREATE OR REPLACE FUNCTION calculate_service_prices(service JSONB)
RETURNS JSONB AS $$
DECLARE
  list_price NUMERIC;
  discount_percentage NUMERIC;
  quantity INTEGER;
  final_price NUMERIC;
BEGIN
  -- Extract and validate numeric values
  list_price := COALESCE((service->>'list_price')::NUMERIC, 0);
  discount_percentage := COALESCE((service->>'discount_percentage')::NUMERIC, 0);
  quantity := COALESCE((service->>'quantity')::INTEGER, 1);
  
  -- Calculate final price
  final_price := ROUND(list_price * quantity * (1 - discount_percentage / 100), 2);
  
  -- Return updated service object
  RETURN jsonb_set(
    service,
    '{final_price}',
    to_jsonb(final_price)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to calculate all prices in an agreement
CREATE OR REPLACE FUNCTION calculate_agreement_prices()
RETURNS TRIGGER AS $$
DECLARE
  updated_office_spaces JSONB := '[]'::jsonb;
  updated_parking_spaces JSONB := '[]'::jsonb;
  updated_services JSONB := '[]'::jsonb;
  office_space JSONB;
  parking_space JSONB;
  service JSONB;
  office_fees_total NUMERIC := 0;
  parking_fees_total NUMERIC := 0;
  service_fees_total NUMERIC := 0;
BEGIN
  -- Process office spaces
  IF NEW.office_spaces IS NOT NULL AND jsonb_array_length(NEW.office_spaces) > 0 THEN
    FOR i IN 0..jsonb_array_length(NEW.office_spaces) - 1 LOOP
      office_space := calculate_office_space_prices(NEW.office_spaces->i);
      updated_office_spaces := updated_office_spaces || office_space;
      
      -- Add to office fees total
      IF NEW.has_fixed_term THEN
        office_fees_total := office_fees_total + COALESCE((office_space->>'fixed_term_price')::NUMERIC, 0);
      ELSE
        office_fees_total := office_fees_total + COALESCE((office_space->>'continuous_term_price')::NUMERIC, 0);
      END IF;
    END LOOP;
    NEW.office_spaces := updated_office_spaces;
  END IF;
  
  -- Process parking spaces
  IF NEW.parking_spaces IS NOT NULL AND jsonb_array_length(NEW.parking_spaces) > 0 THEN
    FOR i IN 0..jsonb_array_length(NEW.parking_spaces) - 1 LOOP
      parking_space := calculate_parking_space_prices(NEW.parking_spaces->i);
      updated_parking_spaces := updated_parking_spaces || parking_space;
      
      -- Add to parking fees total
      parking_fees_total := parking_fees_total + COALESCE((parking_space->>'final_price')::NUMERIC, 0);
    END LOOP;
    NEW.parking_spaces := updated_parking_spaces;
  END IF;
  
  -- Process services
  IF NEW.services IS NOT NULL AND jsonb_array_length(NEW.services) > 0 THEN
    FOR i IN 0..jsonb_array_length(NEW.services) - 1 LOOP
      service := calculate_service_prices(NEW.services->i);
      updated_services := updated_services || service;
      
      -- Add to service fees total
      service_fees_total := service_fees_total + COALESCE((service->>'final_price')::NUMERIC, 0);
    END LOOP;
    NEW.services := updated_services;
  END IF;
  
  -- Update summary fields
  NEW.office_license_fees_total := office_fees_total;
  NEW.parking_fees_total := parking_fees_total;
  NEW.service_fees_total := service_fees_total;
  NEW.monthly_payment_fixed_term := office_fees_total + parking_fees_total + service_fees_total;
  NEW.total_monthly_payment := NEW.monthly_payment_fixed_term;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS calculate_agreement_prices_trigger ON agreements;

CREATE TRIGGER calculate_agreement_prices_trigger
  BEFORE INSERT OR UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION calculate_agreement_prices();

-- Add GIN indexes for JSONB fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'agreements' 
    AND indexname = 'idx_agreements_office_spaces'
  ) THEN
    CREATE INDEX idx_agreements_office_spaces ON agreements USING GIN (office_spaces);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'agreements' 
    AND indexname = 'idx_agreements_parking_spaces'
  ) THEN
    CREATE INDEX idx_agreements_parking_spaces ON agreements USING GIN (parking_spaces);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'agreements' 
    AND indexname = 'idx_agreements_services'
  ) THEN
    CREATE INDEX idx_agreements_services ON agreements USING GIN (services);
  END IF;
END $$;

-- Update existing records with calculated prices
UPDATE agreements
SET 
  updated_at = NOW()
WHERE id IN (
  SELECT id FROM agreements
  WHERE 
    (office_spaces IS NOT NULL AND jsonb_array_length(office_spaces) > 0) OR
    (parking_spaces IS NOT NULL AND jsonb_array_length(parking_spaces) > 0) OR
    (services IS NOT NULL AND jsonb_array_length(services) > 0)
);

-- Add constraints to ensure numeric fields are valid
ALTER TABLE agreements
  ADD CONSTRAINT check_office_license_fees_total 
    CHECK (office_license_fees_total >= 0),
  ADD CONSTRAINT check_parking_fees_total 
    CHECK (parking_fees_total >= 0),
  ADD CONSTRAINT check_service_fees_total 
    CHECK (service_fees_total >= 0),
  ADD CONSTRAINT check_monthly_payment_fixed_term 
    CHECK (monthly_payment_fixed_term >= 0),
  ADD CONSTRAINT check_total_monthly_payment 
    CHECK (total_monthly_payment >= 0);
