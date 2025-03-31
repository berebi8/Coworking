/*
  # Create Clients Management Schema

  1. New Tables
    - `clients`: Stores client company information
      - `id` (uuid, primary key)
      - `name` (text)
      - `company_id` (text, unique)
      - `commercial_name` (text)
      - `sap_number` (text, unique)
      - `primary_contact_name` (text)
      - `primary_contact_email` (text)
      - `primary_contact_phone` (text)
      - `location` (text)
      - `notes` (text)
      - `status` (enum)
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create client status enum
CREATE TYPE client_status AS ENUM ('active', 'inactive');

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id text UNIQUE NOT NULL,
  commercial_name text NOT NULL,
  sap_number text UNIQUE NOT NULL,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  location text,
  notes text,
  status client_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX clients_status_idx ON clients(status);
CREATE INDEX clients_location_idx ON clients(location);
CREATE INDEX clients_commercial_name_idx ON clients(commercial_name);
