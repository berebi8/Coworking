/*
  # Create Termination Notices Schema

  1. New Tables
    - `termination_notices`: Stores termination notice information
      - `id` (uuid, primary key)
      - `doc_id` (text, unique)
      - `company_id` (text, references clients)
      - `notice_date` (date)
      - `recipient_id` (uuid, references users)
      - `expected_end_date` (date)
      - `notes` (text)
      - `status` (enum)
      - Timestamps and audit fields

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create termination notice status enum
CREATE TYPE termination_notice_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Create termination_notices table
CREATE TABLE IF NOT EXISTS termination_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id text UNIQUE NOT NULL,
  company_id text NOT NULL,
  notice_date date NOT NULL,
  recipient_id uuid REFERENCES auth.users(id),
  expected_end_date date NOT NULL,
  notes text,
  status termination_notice_status NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  FOREIGN KEY (company_id) REFERENCES clients(company_id)
);

-- Enable RLS
ALTER TABLE termination_notices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON termination_notices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON termination_notices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON termination_notices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON termination_notices
  FOR DELETE
  TO authenticated
  USING (EXISTS ( 
    SELECT 1 
    FROM app_users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  ));

-- Create updated_at trigger
CREATE TRIGGER update_termination_notices_updated_at
  BEFORE UPDATE ON termination_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX termination_notices_company_id_idx ON termination_notices(company_id);
CREATE INDEX termination_notices_notice_date_idx ON termination_notices(notice_date);
CREATE INDEX termination_notices_expected_end_date_idx ON termination_notices(expected_end_date);
CREATE INDEX termination_notices_status_idx ON termination_notices(status);
