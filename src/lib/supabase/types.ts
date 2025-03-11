export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      user_teams: {
        Row: {
          user_id: string
          team_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          team_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          team_id?: string
          created_at?: string
        }
      }
      totp_codes: {
        Row: {
          id: string
          name: string
          secret: string
          team_id: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          secret: string
          team_id: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          secret?: string
          team_id?: string
          created_at?: string
          created_by?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}