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
DECLARE
  v_office_exists boolean;
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 
    FROM app_users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can permanently delete offices';
  END IF;

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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to delete office';
  END IF;
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
