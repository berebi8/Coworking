/*
  # Create locations table and policies

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `location_id` (text, unique, 5 chars)
      - `notes` (text, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on locations table
    - Add policies for authenticated users:
      - Read access (SELECT)
      - Insert access
      - Update access

  3. Triggers
    - Add updated_at trigger for automatic timestamp updates
*/

-- Create the locations table if it doesn't exist
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

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON locations;
  DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON locations;
  DROP POLICY IF EXISTS "Allow update access to authenticated users" ON locations;
END $$;

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

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE
  ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
