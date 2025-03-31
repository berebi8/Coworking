/*
  # Create Office Properties Schema

  1. New Tables
    - `office_properties`: Stores office information
      - `id` (uuid, primary key)
      - `location_id` (uuid, foreign key to locations)
      - `floor` (integer)
      - `office_id` (text, unique)
      - `default_ws` (integer)
      - `list_price` (integer)
      - `mr_credits` (integer)
      - `print_quota_bw` (integer)
      - `print_quota_color` (integer)
      - `view_type` (enum)
      - `additional_desk_price` (integer)
      - `max_ws` (integer)
      - `notes` (text)
      - `status` (enum)
      - Timestamps and audit fields

    - `office_price_history`: Tracks price changes
      - `id` (uuid, primary key)
      - `office_id` (uuid, foreign key to office_properties)
      - `old_price` (integer)
      - `new_price` (integer)
      - `changed_at` (timestamp)
      - `changed_by` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Constraints
    - Unique office IDs
    - Valid price ranges
    - Valid workstation counts
*/

-- Create view type enum
CREATE TYPE office_view_type AS ENUM ('sea_view', 'city_view', 'internal');

-- Create office status enum
CREATE TYPE office_status AS ENUM ('active', 'inactive', 'deleted');

-- Create office_properties table
CREATE TABLE IF NOT EXISTS office_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  floor integer NOT NULL CHECK (floor > 0),
  office_id text NOT NULL,
  default_ws integer NOT NULL CHECK (default_ws > 0),
  list_price integer NOT NULL CHECK (list_price >= 0),
  mr_credits integer NOT NULL CHECK (mr_credits >= 0),
  print_quota_bw integer NOT NULL CHECK (print_quota_bw >= 0),
  print_quota_color integer NOT NULL CHECK (print_quota_color >= 0),
  view_type office_view_type NOT NULL,
  additional_desk_price integer NOT NULL CHECK (additional_desk_price >= 0),
  max_ws integer NOT NULL CHECK (max_ws >= default_ws),
  notes text,
  status office_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(office_id)
);

-- Create office_price_history table
CREATE TABLE IF NOT EXISTS office_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES office_properties(id),
  old_price integer NOT NULL CHECK (old_price >= 0),
  new_price integer NOT NULL CHECK (new_price >= 0),
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE office_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_price_history ENABLE ROW LEVEL SECURITY;

-- Create policies for office_properties
CREATE POLICY "Enable read access for authenticated users"
  ON office_properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON office_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON office_properties
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for office_price_history
CREATE POLICY "Enable read access for authenticated users"
  ON office_price_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON office_price_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create updated_at trigger for office_properties
CREATE TRIGGER update_office_properties_updated_at
  BEFORE UPDATE ON office_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX office_properties_location_id_idx ON office_properties(location_id);
CREATE INDEX office_properties_status_idx ON office_properties(status);
CREATE INDEX office_properties_view_type_idx ON office_properties(view_type);
CREATE INDEX office_price_history_office_id_idx ON office_price_history(office_id);
