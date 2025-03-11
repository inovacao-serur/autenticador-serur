import { supabase } from './supabase/client'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        data: null,
        error: {
          message: 'Email ou senha inválidos. Por favor, tente novamente.'
        }
      }
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', data.user.id)
        .single()

      return { 
        data: {
          ...data,
          profile
        }, 
        error: null 
      }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Sign in error:', error)
    return {
      data: null,
      error: {
        message: error.message || 'Falha ao fazer login'
      }
    }
  }
}

export async function signOut() {
  try {
    localStorage.removeItem('supabase.auth.token')
    localStorage.removeItem('supabase.auth.expires_at')
    localStorage.removeItem('supabase.auth.refresh_token')
    
    const { error } = await supabase.auth.signOut({
      scope: 'local'
    })
    
    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Sign out error:', error)
    return {
      error: {
        message: error.message || 'Falha ao fazer logout'
      }
    }
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Password reset error:', error)
    return {
      error: {
        message: error.message || 'Falha ao enviar email de recuperação'
      }
    }
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Update password error:', error)
    return {
      error: {
        message: error.message || 'Falha ao atualizar senha'
      }
    }
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error: any) {
    console.error('Get session error:', error)
    return {
      session: null,
      error: {
        message: error.message || 'Falha ao obter sessão'
      }
    }
  }
}

export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', user.id)
        .single()

      return { 
        user: {
          ...user,
          metadata: profile?.metadata
        }, 
        error: null 
      }
    }

    return { user: null, error: null }
  } catch (error: any) {
    console.error('Get user error:', error)
    return {
      user: null,
      error: {
        message: error.message || 'Falha ao obter usuário'
      }
    }
  }
}

export async function isAdmin(userId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .single()

    return profile?.metadata?.is_admin || false
  } catch (error: any) {
    console.error('Error checking admin status:', error)
    return false
  }
}