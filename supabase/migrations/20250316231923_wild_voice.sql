/*
  # Permanently Delete Soft-Deleted Offices

  1. Changes
    - Remove all office records with status = 'deleted'
    - Remove associated price history records
    - Maintain referential integrity

  2. Security
    - Only affects records already marked as deleted
    - Preserves active and inactive records
    - Maintains data consistency
*/

-- First delete price history records for deleted offices
DELETE FROM office_price_history
WHERE office_id IN (
  SELECT id 
  FROM office_properties 
  WHERE status = 'deleted'
);

-- Then delete the office records themselves
DELETE FROM office_properties
WHERE status = 'deleted';
