/*
  # Fix RLS policies for app_users table

  1. Changes
    - Drop and recreate RLS policies with proper authentication checks
    - Remove role() function usage which was causing the errors
    - Maintain table security while allowing proper access

  2. Security
    - Maintain RLS protection
    - Ensure authenticated users can perform necessary operations
    - Keep existing table structure intact
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON app_users;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON app_users;
  DROP POLICY IF EXISTS "Enable update access for authenticated users" ON app_users;
END $$;

-- Create new policies with proper authentication checks
CREATE POLICY "Enable read access for authenticated users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update access for authenticated users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
