/*
  # Add RLS policies for user teams table

  1. Security Changes
    - Enable RLS on user_teams table
    - Add policy for admins to manage all user teams
    - Add policy for users to view their own team memberships
*/

ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all user teams
CREATE POLICY "Admins can manage all user teams"
  ON user_teams
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Allow users to view their own team memberships
CREATE POLICY "Users can view their own team memberships"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);