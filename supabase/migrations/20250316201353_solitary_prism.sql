/*
  # Fix RLS policies for app_users table

  1. Changes
    - Remove role() checks from RLS policies
    - Simplify policies to allow all authenticated users to perform operations
    - Keep existing table structure

  2. Security
    - Maintain RLS on app_users table
    - Update policies to be less restrictive while maintaining authentication requirement
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON app_users;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON app_users;
  DROP POLICY IF EXISTS "Enable update access for authenticated users" ON app_users;
END $$;

-- Create simplified policies that only check for authentication
CREATE POLICY "Enable read access for authenticated users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
