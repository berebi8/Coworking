/*
  # Clear all office data

  1. Changes
    - Delete all records from office_price_history
    - Delete all records from office_properties
    - Reset sequences if any

  2. Security
    - No changes to RLS policies
*/

-- First delete all price history records
DELETE FROM office_price_history;

-- Then delete all office records
DELETE FROM office_properties;
