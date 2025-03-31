/*
  # Fix permanent delete functionality with direct deletion

  1. Changes
    - Remove complex function and just use direct DELETE
    - Simplify RLS policies
    - Remove unnecessary checks
*/

-- Drop existing function as we'll use direct deletion
DROP FUNCTION IF EXISTS permanently_delete_office(uuid);

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON office_properties;
DROP POLICY IF EXISTS "Enable delete for price history" ON office_price_history;

-- Create simple delete policies for admins
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
