/*
  # Create Office Properties Management Schema

  1. New Tables
    - `office_properties`: Stores office space information
      - `id` (uuid, primary key)
      - `location_id` (uuid, foreign key to locations)
      - `floor` (integer)
      - `office_id` (text, unique)
      - `default_ws` (integer)
      - `list_price` (numeric)
      - `mr_credits` (integer)
      - `print_quota_bw` (integer)
      - `print_quota_color` (integer)
      - `view_type` (text)
      - `additional_desk_price` (numeric)
      - `max_ws` (integer)
      - `notes` (text)
      - `status` (office_status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `deleted_at` (timestamp)

  2. Security
    - Enable RLS on `office_properties` table
    - Add policies for authenticated users
*/

-- Create office status enum
CREATE TYPE office_status AS ENUM ('active', 'inactive', 'deleted');

-- Create office view type enum
CREATE TYPE office_view_type AS ENUM ('sea_view', 'city_view', 'internal');

-- Create the office_properties table
CREATE TABLE IF NOT EXISTS office_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  floor integer NOT NULL,
  office_id text NOT NULL,
  default_ws integer NOT NULL CHECK (default_ws > 0),
  list_price numeric NOT NULL CHECK (list_price > 0),
  mr_credits integer NOT NULL DEFAULT 0 CHECK (mr_credits >= 0),
  print_quota_bw integer NOT NULL DEFAULT 0 CHECK (print_quota_bw >= 0),
  print_quota_color integer NOT NULL DEFAULT 0 CHECK (print_quota_color >= 0),
  view_type office_view_type NOT NULL,
  additional_desk_price numeric NOT NULL CHECK (additional_desk_price >= 0),
  max_ws integer NOT NULL CHECK (max_ws >= default_ws),
  notes text,
  status office_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT office_id_unique UNIQUE (office_id),
  CONSTRAINT valid_floor_number CHECK (floor > 0)
);

-- Create indexes
CREATE INDEX office_properties_location_id_idx ON office_properties(location_id);
CREATE INDEX office_properties_floor_idx ON office_properties(floor);
CREATE INDEX office_properties_status_idx ON office_properties(status);

-- Enable RLS
ALTER TABLE office_properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON office_properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON office_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
  ON office_properties
  FOR UPDATE
  TO authenticated
  USING (role() = 'authenticated')
  WITH CHECK (role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER update_office_properties_updated_at
  BEFORE UPDATE ON office_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create price history table
CREATE TABLE IF NOT EXISTS office_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES office_properties(id),
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid NOT NULL REFERENCES app_users(id)
);

-- Enable RLS on price history
ALTER TABLE office_price_history ENABLE ROW LEVEL SECURITY;

-- Create policies for price history
CREATE POLICY "Enable read access for authenticated users"
  ON office_price_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON office_price_history
  FOR INSERT
  TO authenticated
  WITH CHECK (role() = 'authenticated');
