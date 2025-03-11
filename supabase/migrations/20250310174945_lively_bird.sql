/*
  # Initial Schema Setup for TOTP Authentication System

  1. New Tables
    - teams
      - id (uuid, primary key)
      - name (text, unique)
      - created_at (timestamp)
    
    - user_teams
      - user_id (uuid, references auth.users)
      - team_id (uuid, references teams)
      - created_at (timestamp)
    
    - totp_codes
      - id (uuid, primary key)
      - name (text)
      - secret (text)
      - team_id (uuid, references teams)
      - created_at (timestamp)
      - created_by (uuid, references auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for admin users
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_teams junction table
CREATE TABLE IF NOT EXISTS user_teams (
  user_id uuid REFERENCES auth.users NOT NULL,
  team_id uuid REFERENCES teams NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, team_id)
);

-- Create totp_codes table
CREATE TABLE IF NOT EXISTS totp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  secret text NOT NULL,
  team_id uuid REFERENCES teams NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users NOT NULL
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE totp_codes ENABLE ROW LEVEL SECURITY;

-- Create admin role
CREATE ROLE admin;

-- Teams policies
CREATE POLICY "Users can view teams they belong to"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams
      WHERE user_teams.team_id = teams.id
      AND user_teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage teams"
  ON teams
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- User teams policies
CREATE POLICY "Users can view their team memberships"
  ON user_teams
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage team memberships"
  ON user_teams
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- TOTP codes policies
CREATE POLICY "Users can view TOTP codes for their teams"
  ON totp_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams
      WHERE user_teams.team_id = totp_codes.team_id
      AND user_teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage TOTP codes"
  ON totp_codes
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- Insert initial teams
INSERT INTO teams (name) VALUES
  ('Aristóteles de Queiroz Camara'),
  ('Brunna Quinteiro Wavrik'),
  ('Feliciano Lyra Moura'),
  ('Felipe Varela Caon'),
  ('Ian Mac Dowell'),
  ('João Loyo de Meira Lins'),
  ('Paulo Rafael de Lucena Ferreira')
ON CONFLICT (name) DO NOTHING;