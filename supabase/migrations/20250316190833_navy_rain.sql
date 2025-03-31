/*
  # Create locations table and policies

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `location_id` (text, unique, 5-char code)
      - `notes` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `locations` table
    - Add policies for authenticated users to:
      - Read all locations
      - Create new locations
      - Update existing locations
      - Soft delete locations
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  location_id text UNIQUE NOT NULL CHECK (length(location_id) = 5),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all authenticated users"
  ON locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to authenticated users"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE
  ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
