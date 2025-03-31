/*
  # Create Agreements Schema

  1. New Tables
    - `agreements`: Stores all agreement information
    - `agreement_office_spaces`: Maps offices to agreements
    - `agreement_parking_spaces`: Maps parking spaces to agreements
    - `agreement_services`: Maps additional services to agreements

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create agreement status enum
CREATE TYPE agreement_status AS ENUM ('draft', 'draft_approved', 'signed', 'cancelled');

-- Create agreement type enum
CREATE TYPE agreement_type AS ENUM ('license', 'addendum', 'termination');

-- Create service agreement type enum
CREATE TYPE service_agreement_type AS ENUM ('private_office', 'hot_desk');

-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id text UNIQUE NOT NULL,
  type agreement_type NOT NULL,
  status agreement_status NOT NULL DEFAULT 'draft',
  
  -- Basic Information
  licensor_name text NOT NULL,
  licensee_name text NOT NULL,
  company_id text NOT NULL,
  commercial_name text NOT NULL,
  address text NOT NULL,
  document_date date NOT NULL,
  building text NOT NULL,
  service_agreement_type service_agreement_type NOT NULL,
  permitted_use text NOT NULL,

  -- License Terms
  start_date date NOT NULL,
  first_fixed_term_duration integer,
  first_fixed_term_end_date date,
  notice_period_fixed integer NOT NULL,
  
  continuous_term_duration text NOT NULL,
  continuous_term_start_date date,
  notice_period_continuous integer NOT NULL,

  -- Credit Allotments
  conference_room_credits integer NOT NULL DEFAULT 0,
  print_credits_bw integer NOT NULL DEFAULT 0,
  print_credits_color integer NOT NULL DEFAULT 0,
  credit_notes text,

  -- Totals
  office_license_fees_total integer NOT NULL DEFAULT 0,
  monthly_payment_fixed_term integer NOT NULL DEFAULT 0,
  security_deposit_fixed integer NOT NULL DEFAULT 0,
  security_deposit_continuous integer NOT NULL DEFAULT 0,
  total_monthly_payment integer NOT NULL DEFAULT 0,

  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create agreement_office_spaces table
CREATE TABLE IF NOT EXISTS agreement_office_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE,
  office_id uuid REFERENCES office_properties(id),
  workstations integer NOT NULL,
  list_price integer NOT NULL,
  discount_percentage integer NOT NULL DEFAULT 0,
  fixed_term_price integer NOT NULL,
  continuous_term_price integer NOT NULL,
  notes text,
  UNIQUE(agreement_id, office_id)
);

-- Create agreement_parking_spaces table
CREATE TABLE IF NOT EXISTS agreement_parking_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE,
  parking_type text NOT NULL,
  list_price integer NOT NULL,
  discount_percentage integer NOT NULL DEFAULT 0,
  final_price integer NOT NULL,
  notes text,
  UNIQUE(agreement_id, parking_type)
);

-- Create agreement_services table
CREATE TABLE IF NOT EXISTS agreement_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE,
  service_id uuid REFERENCES addon_services(id),
  type text NOT NULL,
  list_price integer NOT NULL,
  discount_percentage integer NOT NULL DEFAULT 0,
  final_price integer NOT NULL,
  notes text,
  UNIQUE(agreement_id, service_id)
);

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_office_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_services ENABLE ROW LEVEL SECURITY;

-- Create policies for agreements
CREATE POLICY "Enable read access for authenticated users"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON agreements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

-- Create updated_at triggers
CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX agreements_status_idx ON agreements(status);
CREATE INDEX agreements_type_idx ON agreements(type);
CREATE INDEX agreements_building_idx ON agreements(building);
CREATE INDEX agreements_commercial_name_idx ON agreements(commercial_name);
CREATE INDEX agreements_start_date_idx ON agreements(start_date);
CREATE INDEX agreement_office_spaces_agreement_id_idx ON agreement_office_spaces(agreement_id);
CREATE INDEX agreement_parking_spaces_agreement_id_idx ON agreement_parking_spaces(agreement_id);
CREATE INDEX agreement_services_agreement_id_idx ON agreement_services(agreement_id);
