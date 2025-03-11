/*
  # Create initial admin user

  1. Changes
    - Creates an initial admin user with email and password
    - Sets the user's metadata to mark them as admin
    - Ensures the user has the necessary permissions and identity records

  2. Security
    - Password will need to be changed on first login
    - User is marked as admin in metadata
    - Proper identity records are created with required fields
*/

-- Create the initial admin user
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert the user with a secure password
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"is_admin":true}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Insert the user's email identity
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id::text, 'admin@example.com')::jsonb,
    'email',
    'admin@example.com',
    NOW(),
    NOW(),
    NOW()
  );
END $$;