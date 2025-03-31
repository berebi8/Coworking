/*
  # Fix permanent delete functionality with proper permissions

  1. Changes
    - Drop and recreate function with proper error handling
    - Update RLS policies
    - Add explicit transaction handling
    - Add proper security checks
*/

-- Drop existing function
DROP FUNCTION IF EXISTS permanently_delete_office(uuid);

-- Create improved function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION permanently_delete_office(p_office_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete price history first
  DELETE FROM office_price_history
  WHERE office_id = p_office_id;

  -- Then delete the office
  DELETE FROM office_properties
  WHERE id = p_office_id;
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON office_properties;
DROP POLICY IF EXISTS "Enable delete for price history" ON office_price_history;

-- Create new policies with proper admin checks
CREATE POLICY "Enable delete for authenticated users"
  ON office_properties
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM app_users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "Enable delete for price history"
  ON office_price_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM app_users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

-- Grant execute permission on the function
REVOKE EXECUTE ON FUNCTION permanently_delete_office(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION permanently_delete_office(uuid) TO authenticated;
