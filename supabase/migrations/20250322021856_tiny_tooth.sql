/*
  # Add Missing Agreement Fields

  1. Changes
    - Add special discount percentage to agreement_office_spaces
    - Add quantity field to agreement_parking_spaces
    - Add quantity field to agreement_services
    - Add final_price calculations

  2. Data Migration
    - Set default values for new fields
    - Calculate final prices based on existing data
*/

-- Add special discount percentage to agreement_office_spaces
ALTER TABLE agreement_office_spaces
  ADD COLUMN special_discount_percentage integer NOT NULL DEFAULT 0;

-- Add quantity field to agreement_parking_spaces
ALTER TABLE agreement_parking_spaces
  ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Add quantity field to agreement_services
ALTER TABLE agreement_services
  ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Update final price calculations
UPDATE agreement_parking_spaces
SET final_price = ROUND(list_price * (1 - discount_percentage::float / 100) * quantity);

UPDATE agreement_services
SET final_price = ROUND(list_price * (1 - discount_percentage::float / 100) * quantity);

-- Add constraints to ensure valid values
ALTER TABLE agreement_office_spaces
  ADD CONSTRAINT agreement_office_spaces_special_discount_percentage_check 
  CHECK (special_discount_percentage >= 0 AND special_discount_percentage <= 100);

ALTER TABLE agreement_parking_spaces
  ADD CONSTRAINT agreement_parking_spaces_quantity_check 
  CHECK (quantity > 0);

ALTER TABLE agreement_services
  ADD CONSTRAINT agreement_services_quantity_check 
  CHECK (quantity > 0);
