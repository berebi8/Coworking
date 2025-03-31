/*
  # Add delete policy for app_users table

  1. Changes
    - Add policy to allow authenticated users to delete records from app_users table

  2. Security
    - Only authenticated users can delete records
*/

-- Create delete policy for app_users
CREATE POLICY "Enable delete for authenticated users"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
