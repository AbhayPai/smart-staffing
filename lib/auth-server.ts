'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from './supabase/server'
import type { LoginFormData } from '@/types/user'

// ─── Sign In (Server Action) ────────────────────────────────────────────────

export async function signInServer(data: LoginFormData): Promise<never | { error: string }> {
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { error: error.message }
  }

  // If signInWithPassword succeeded, cookies are set and session is established
  // Revalidate all routes and redirect to dashboard
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
