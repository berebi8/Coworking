/*
  # Create users management tables and policies

  1. New Tables
    - `app_users`: Stores application user information
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `full_name` (text)
      - `email` (text, unique)
      - `role` (text)
      - `notes` (text)
      - `is_active` (boolean)
      - `last_login` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_users` table
    - Add policies for authenticated users
*/

-- Create the app_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Finance Manager', 'Coworking Manager', 'Client')),
  notes text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON app_users;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON app_users;
  DROP POLICY IF EXISTS "Enable update access for authenticated users" ON app_users;
END $$;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (role() = 'authenticated')
  WITH CHECK (role() = 'authenticated');

-- Create updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE
  ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
