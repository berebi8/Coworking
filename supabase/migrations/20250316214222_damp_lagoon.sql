/*
  # Fix Location Floors Migration

  This migration ensures policies are created only if they don't already exist.
  It uses DO blocks to safely check and create policies.
*/

-- Drop existing policies if needed
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON location_floors;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON location_floors;
  DROP POLICY IF EXISTS "Enable update access for authenticated users" ON location_floors;
END $$;

-- Create policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'location_floors' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
      ON location_floors
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'location_floors' 
    AND policyname = 'Enable insert access for authenticated users'
  ) THEN
    CREATE POLICY "Enable insert access for authenticated users"
      ON location_floors
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'location_floors' 
    AND policyname = 'Enable update access for authenticated users'
  ) THEN
    CREATE POLICY "Enable update access for authenticated users"
      ON location_floors
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
