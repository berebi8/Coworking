/*
  # Add Location Floors Management

  1. New Tables
    - `location_floors`: Stores floor information for each location
      - `id` (uuid, primary key)
      - `location_id` (uuid, references locations)
      - `floor_number` (integer)
      - `notes` (text)
      - `status` (location_status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `deleted_at` (timestamp)

  2. Security
    - Enable RLS on `location_floors` table
    - Add policies for authenticated users
*/

-- Create location_floors table
CREATE TABLE IF NOT EXISTS location_floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  floor_number integer NOT NULL CHECK (floor_number > 0),
  notes text,
  status location_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(location_id, floor_number)
);

-- Enable RLS
ALTER TABLE location_floors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON location_floors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON location_floors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON location_floors
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_location_floors_updated_at
  BEFORE UPDATE ON location_floors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX location_floors_location_id_idx ON location_floors(location_id);
CREATE INDEX location_floors_status_idx ON location_floors(status);
