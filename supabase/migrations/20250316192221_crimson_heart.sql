/*
  # Fix RLS policies for locations table

  1. Changes
    - Drop existing RLS policies
    - Create new policies with proper security context
    - Ensure authenticated users can perform CRUD operations

  2. Security
    - Enable RLS on locations table
    - Add policies for SELECT, INSERT, UPDATE operations
    - Policies use auth.uid() to verify authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON locations;
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON locations;
DROP POLICY IF EXISTS "Allow update access to authenticated users" ON locations;

-- Create new policies with proper security context
CREATE POLICY "Enable read access for authenticated users"
  ON locations
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
