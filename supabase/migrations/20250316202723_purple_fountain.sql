/*
  # Create default admin user

  1. Changes
    - Create a default admin user for initial access
    - Email: admin@example.com
    - Password: admin123 (should be changed after first login)

  2. Security
    - Uses Supabase's built-in auth.users table
    - Creates corresponding app_users record
*/

-- Create default admin user in auth.users if it doesn't exist
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'admin@example.com';

  -- If user doesn't exist, create it
  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO user_id;
  END IF;

  -- Create corresponding app_users record if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM public.app_users WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO public.app_users (
      id,
      username,
      full_name,
      email,
      role,
      notes,
      is_active,
      last_login
    ) VALUES (
      user_id,
      'admin',
      'System Administrator',
      'admin@example.com',
      'Admin',
      'Default admin user',
      true,
      now()
    );
  END IF;
END $$;
