import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export const supabaseSignUp = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase-signup',
  },
})

export type Team = Database['public']['Tables']['teams']['Row']
export type UserTeam = Database['public']['Tables']['user_teams']['Row']
export type TOTPCode = Database['public']['Tables']['totp_codes']['Row']