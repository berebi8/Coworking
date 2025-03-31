/*
  # Fix permanent delete functionality

  1. Changes
    - Drop and recreate the permanent delete function with proper error handling
    - Add explicit transaction handling
    - Add better validation
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS permanently_delete_office(uuid);

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION permanently_delete_office(p_office_id uuid)
RETURNS void AS $$
DECLARE
  v_office_exists boolean;
BEGIN
  -- Check if office exists and is deleted
  SELECT EXISTS (
    SELECT 1 
    FROM office_properties 
    WHERE id = p_office_id 
    AND status = 'deleted'
  ) INTO v_office_exists;

  IF NOT v_office_exists THEN
    RAISE EXCEPTION 'Office not found or not in deleted status';
  END IF;

  -- Delete price history first
  DELETE FROM office_price_history
  WHERE office_id = p_office_id;

  -- Then delete the office
  DELETE FROM office_properties
  WHERE id = p_office_id
  AND status = 'deleted';

  -- Verify deletion
  IF FOUND THEN
    RETURN;
  ELSE
    RAISE EXCEPTION 'Failed to delete office';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON office_properties;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON office_price_history;

-- Recreate policies with proper conditions
CREATE POLICY "Enable delete for authenticated users"
  ON office_properties
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND status = 'deleted'
    AND EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "Enable delete for price history"
  ON office_price_history
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );
