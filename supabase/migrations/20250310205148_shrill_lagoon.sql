/*
  # Add profile creation trigger

  1. Changes
    - Add trigger function to create profiles automatically
    - Add trigger to fire on auth.users insert
    
  2. Details
    - Creates a profile in public.profiles when a new user is created
    - Copies email and metadata from auth.users
*/

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, metadata)
  VALUES (
    NEW.id,
    NEW.email,
    json_build_object(
      'name', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      'is_admin', COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users
INSERT INTO public.profiles (id, email, metadata)
SELECT 
  id,
  email,
  json_build_object(
    'name', COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
    'is_admin', COALESCE((raw_user_meta_data->>'is_admin')::boolean, false)
  ) as metadata
FROM auth.users
ON CONFLICT (id) DO NOTHING;