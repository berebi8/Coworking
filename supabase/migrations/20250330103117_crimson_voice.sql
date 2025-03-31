-- First drop the view that depends on the type
DROP VIEW IF EXISTS termination_notices_view;

-- Drop objects that depend on the enum
DROP TRIGGER IF EXISTS update_termination_notices_updated_at ON termination_notices;
ALTER TABLE termination_notices ALTER COLUMN status DROP DEFAULT;
DROP TABLE termination_notices;
DROP TYPE termination_notice_status;

-- Recreate enum without 'completed' status
CREATE TYPE termination_notice_status AS ENUM ('draft', 'active', 'cancelled');

-- Recreate termination_notices table
CREATE TABLE termination_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id text UNIQUE NOT NULL,
  company_id text NOT NULL,
  notice_date date NOT NULL,
  recipient_id uuid REFERENCES app_users(id),
  expected_end_date date NOT NULL,
  override_end_date date,
  notes text,
  status termination_notice_status NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES app_users(id),
  updated_by uuid REFERENCES app_users(id),
  FOREIGN KEY (company_id) REFERENCES clients(company_id)
);

-- Create partial unique index for active notices
CREATE UNIQUE INDEX unique_active_notice_per_company 
ON termination_notices (company_id) 
WHERE status = 'active';

-- Add date validation
ALTER TABLE termination_notices
  ADD CONSTRAINT termination_notices_date_check
  CHECK (
    override_end_date IS NULL OR 
    override_end_date >= notice_date
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
CREATE INDEX termination_notices_recipient_id_idx ON termination_notices(recipient_id);
CREATE INDEX termination_notices_created_by_idx ON termination_notices(created_by);
CREATE INDEX termination_notices_updated_by_idx ON termination_notices(updated_by);

-- Recreate the view
CREATE OR REPLACE VIEW termination_notices_view AS
SELECT 
  tn.*,
  au.username as recipient_username,
  c.commercial_name as client_name,
  CASE 
    WHEN tn.override_end_date IS NOT NULL THEN true
    ELSE false
  END as is_overridden,
  -- Add a check for existing active notice
  EXISTS (
    SELECT 1 
    FROM termination_notices tn2 
    WHERE tn2.company_id = tn.company_id 
    AND tn2.status = 'active'
    AND tn2.id != tn.id
  ) as has_active_notice
FROM termination_notices tn
LEFT JOIN app_users au ON au.id = tn.recipient_id
LEFT JOIN clients c ON c.company_id = tn.company_id;
