/*
  # Set up admin role and policies

  1. Changes
    - Create admin role check function
    - Create or update RLS policies for teams and TOTP codes tables
    - Only create policies if they don't exist

  2. Security
    - Only admins can manage teams and TOTP codes
    - Regular users can only view their team's data
*/

-- Create admin role check function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'is_admin' = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop teams policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'teams' 
    AND policyname = 'Admins can manage teams'
  ) THEN
    DROP POLICY "Admins can manage teams" ON public.teams;
  END IF;

  -- Drop totp_codes policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'totp_codes' 
    AND policyname = 'Admins can manage TOTP codes'
  ) THEN
    DROP POLICY "Admins can manage TOTP codes" ON public.totp_codes;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Admins can manage teams"
ON public.teams
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage TOTP codes"
ON public.totp_codes
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));