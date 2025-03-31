/*
  # Create Add-On Services Schema

  1. Changes
    - Create enum types if they don't exist
    - Create addon_services table
    - Add RLS policies and indexes
    - Handle existing policies gracefully

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create service type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'addon_service_type') THEN
    CREATE TYPE addon_service_type AS ENUM (
      'parking_reserved',
      'parking_unassigned',
      'parking_ev',
      'parking_vip',
      'room',
      'storage',
      'technology',
      'support',
      'amenities'
    );
  END IF;
END $$;

-- Create service status enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'addon_service_status') THEN
    CREATE TYPE addon_service_status AS ENUM ('active', 'inactive', 'deleted');
  END IF;
END $$;

-- Create addon_services table
CREATE TABLE IF NOT EXISTS addon_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type addon_service_type NOT NULL,
  is_incidental boolean NOT NULL DEFAULT false,
  list_price integer NOT NULL CHECK (list_price >= 0),
  quantity integer CHECK (quantity > 0),
  locations uuid[] NOT NULL DEFAULT '{}',
  notes text,
  status addon_service_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT addon_services_name_type_key UNIQUE (name, type)
);

-- Enable RLS
ALTER TABLE addon_services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON addon_services;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON addon_services;
  DROP POLICY IF EXISTS "Enable update access for authenticated users" ON addon_services;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON addon_services;
END $$;

-- Create policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'addon_services' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
      ON addon_services
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'addon_services' 
    AND policyname = 'Enable insert access for authenticated users'
  ) THEN
    CREATE POLICY "Enable insert access for authenticated users"
      ON addon_services
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'addon_services' 
    AND policyname = 'Enable update access for authenticated users'
  ) THEN
    CREATE POLICY "Enable update access for authenticated users"
      ON addon_services
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'addon_services' 
    AND policyname = 'Enable delete for authenticated users'
  ) THEN
    CREATE POLICY "Enable delete for authenticated users"
      ON addon_services
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
  END IF;
END $$;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_addon_services_updated_at ON addon_services;

CREATE TRIGGER update_addon_services_updated_at
  BEFORE UPDATE ON addon_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS addon_services_type_idx ON addon_services(type);
CREATE INDEX IF NOT EXISTS addon_services_status_idx ON addon_services(status);
CREATE INDEX IF NOT EXISTS addon_services_locations_idx ON addon_services USING gin(locations);
