/*
  # Fix user_teams policies and admin function

  1. Changes
    - Add is_admin function to check if a user is an admin
    - Add proper RLS policies for user_teams table
    - Add admin metadata to users on sign up

  2. Security
    - Enable RLS on user_teams table
    - Add policies for admin and regular users
    - Ensure admins can manage all user teams
    - Users can only view their own team memberships
*/

-- Create is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT coalesce(
    (SELECT raw_user_meta_data->>'is_admin' = 'true'
    FROM auth.users
    WHERE id = user_id),
    false
  );
$$;

-- Enable RLS on user_teams
ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own team memberships" ON public.user_teams;
DROP POLICY IF EXISTS "Admins can manage all user teams" ON public.user_teams;

-- Create new policies
CREATE POLICY "Users can view their own team memberships"
ON public.user_teams
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE POLICY "Admins can manage all user teams"
ON public.user_teams
FOR ALL
TO authenticated
USING (
  is_admin(auth.uid())
)
WITH CHECK (
  is_admin(auth.uid())
);

-- Create a trigger to set initial admin user
CREATE OR REPLACE FUNCTION public.handle_first_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  ) THEN
    -- First user becomes admin
    UPDATE auth.users
    SET raw_user_meta_data = 
      CASE 
        WHEN raw_user_meta_data IS NULL THEN 
          jsonb_build_object('is_admin', true)
        ELSE 
          raw_user_meta_data || jsonb_build_object('is_admin', true)
      END
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_user();