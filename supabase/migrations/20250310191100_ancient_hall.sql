/*
  # Update user_teams table policies

  1. Changes
    - Add policy to allow admins to insert records into user_teams table
    - Modify existing policies to be more specific about their purpose

  2. Security
    - Enable RLS on user_teams table (if not already enabled)
    - Add policy for admin users to manage team memberships
    - Maintain existing policy for users to view their own team memberships
*/

-- Enable RLS if not already enabled
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Admins can manage team memberships" ON user_teams;
DROP POLICY IF EXISTS "Users can view their team memberships" ON user_teams;

-- Create new policies with proper permissions
CREATE POLICY "Admins can manage team memberships"
ON user_teams
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view their team memberships"
ON user_teams
FOR SELECT
TO authenticated
USING (user_id = auth.uid());