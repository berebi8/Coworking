/*
  # Create Add-On Services Schema

  1. New Tables
    - `addon_services`: Stores all add-on services including parking
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (enum)
      - `is_incidental` (boolean)
      - `list_price` (integer)
      - `quantity` (integer, null for unlimited)
      - `locations` (uuid[], for multi-location services)
      - `notes` (text)
      - `status` (enum)
      - Timestamps and audit fields

  2. Security
    - Enable RLS
    - Add policies for authenticated users

  3. Data Migration
    - Migrate existing parking and additional services data
*/

-- Create service type enum
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

-- Create service status enum
CREATE TYPE addon_service_status AS ENUM ('active', 'inactive', 'deleted');

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

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON addon_services
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON addon_services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON addon_services
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

-- Create updated_at trigger
CREATE TRIGGER update_addon_services_updated_at
  BEFORE UPDATE ON addon_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX addon_services_type_idx ON addon_services(type);
CREATE INDEX addon_services_status_idx ON addon_services(status);
CREATE INDEX addon_services_locations_idx ON addon_services USING gin(locations);
