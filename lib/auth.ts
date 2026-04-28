import { createClient } from './supabase/client'
import type { SignUpFormData, LoginFormData, UserProfile } from '@/types/user'

// ─── Sign Up ────────────────────────────────────────────────────────────────

export async function signUp(data: SignUpFormData): Promise<{ error: string | null }> {
  const supabase = createClient()

  // 1. Create auth user with metadata
  // The Postgres trigger will automatically create the profile from this metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        department: data.department,
        role: data.role,
      },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Sign-up failed. Please try again.' }

  return { error: null }
}

// ─── Sign In (Client) ──────────────────────────────────────────────────────

export async function signIn(data: LoginFormData): Promise<{ error: string | null }> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) return { error: error.message }
  return { error: null }
}

// ─── Sign Out ───────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

// ─── Get current user profile ───────────────────────────────────────────────

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null
  return data as UserProfile
}
