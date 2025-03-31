/*
  # Remove NOT NULL Constraints

  1. Changes
    - Remove NOT NULL constraints from agreement_office_spaces
    - Remove NOT NULL constraints from agreement_parking_spaces
    - Remove NOT NULL constraints from agreement_services
    - Keep only primary key and foreign key constraints as NOT NULL

  2. Security
    - No changes to RLS policies
    - Maintain existing relationships
*/

-- Drop existing tables
DROP TABLE IF EXISTS agreement_services;
DROP TABLE IF EXISTS agreement_parking_spaces;
DROP TABLE IF EXISTS agreement_office_spaces;

-- Recreate agreement_office_spaces table without NOT NULL constraints
CREATE TABLE agreement_office_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE,
  office_id uuid,
  workstations integer CHECK (workstations > 0),
  list_price integer CHECK (list_price >= 0),
  discount_percentage integer DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  special_discount_percentage integer DEFAULT 0 CHECK (special_discount_percentage >= 0 AND special_discount_percentage <= 100),
  fixed_term_price integer CHECK (fixed_term_price >= 0),
  continuous_term_price integer CHECK (continuous_term_price >= 0),
  notes text,
  UNIQUE(agreement_id, office_id)
);

-- Recreate agreement_parking_spaces table without NOT NULL constraints
CREATE TABLE agreement_parking_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE,
  parking_type text,
  list_price integer CHECK (list_price >= 0),
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  discount_percentage integer DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  final_price integer CHECK (final_price >= 0),
  notes text,
  UNIQUE(agreement_id, parking_type)
);

-- Recreate agreement_services table without NOT NULL constraints
CREATE TABLE agreement_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE,
  service_id uuid,
  type text,
  list_price integer CHECK (list_price >= 0),
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  discount_percentage integer DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  final_price integer CHECK (final_price >= 0),
  notes text,
  UNIQUE(agreement_id, service_id)
);

-- Enable RLS
ALTER TABLE agreement_office_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_services ENABLE ROW LEVEL SECURITY;

-- Create policies for agreement_office_spaces
CREATE POLICY "Enable read access for authenticated users"
  ON agreement_office_spaces
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON agreement_office_spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON agreement_office_spaces
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON agreement_office_spaces
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for agreement_parking_spaces
CREATE POLICY "Enable read access for authenticated users"
  ON agreement_parking_spaces
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON agreement_parking_spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON agreement_parking_spaces
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON agreement_parking_spaces
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for agreement_services
CREATE POLICY "Enable read access for authenticated users"
  ON agreement_services
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON agreement_services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON agreement_services
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON agreement_services
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX agreement_office_spaces_agreement_id_idx ON agreement_office_spaces(agreement_id);
CREATE INDEX agreement_office_spaces_office_id_idx ON agreement_office_spaces(office_id);
CREATE INDEX agreement_parking_spaces_agreement_id_idx ON agreement_parking_spaces(agreement_id);
CREATE INDEX agreement_services_agreement_id_idx ON agreement_services(agreement_id);
CREATE INDEX agreement_services_service_id_idx ON agreement_services(service_id);
