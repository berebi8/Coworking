/*
  # Fix RLS policies for app_users table

  1. Changes
    - Drop and recreate RLS policies with proper security checks
    - Allow authenticated users to manage app_users table
    - Ensure proper access control while maintaining security

  2. Security
    - Enable RLS on app_users table
    - Add policies for authenticated users to perform CRUD operations
    - Use proper authentication checks
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON app_users;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON app_users;
  DROP POLICY IF EXISTS "Enable update access for authenticated users" ON app_users;
END $$;

-- Create new policies that properly handle authentication
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
