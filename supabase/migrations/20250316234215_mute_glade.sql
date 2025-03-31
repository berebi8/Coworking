/*
  # Add permanent delete functionality for deleted offices

  1. Changes
    - Add policy to allow permanent deletion of offices
    - Add policy to allow permanent deletion of price history
    - Add function to handle permanent deletion

  2. Security
    - Only allow deletion of offices that are already in "deleted" status
    - Ensure price history is cleaned up
*/

-- Create function to handle permanent deletion
CREATE OR REPLACE FUNCTION permanently_delete_office(office_id uuid)
RETURNS void AS $$
BEGIN
  -- First delete price history records
  DELETE FROM office_price_history
  WHERE office_id = permanently_delete_office.office_id;

  -- Then delete the office record
  DELETE FROM office_properties
  WHERE id = permanently_delete_office.office_id
  AND status = 'deleted';
END;
$$ LANGUAGE plpgsql;

-- Add policy for permanent deletion
CREATE POLICY "Enable delete for authenticated users"
  ON office_properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND status = 'deleted');

-- Add policy for price history deletion
CREATE POLICY "Enable delete for authenticated users"
  ON office_price_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
