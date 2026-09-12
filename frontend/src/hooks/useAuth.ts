import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    const trimmedEmail = email.trim()
    const trimmedName = (name || trimmedEmail.split('@')[0]).trim()
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          name: trimmedName,
          full_name: trimmedName,
        },
      },
    })
    if (error) {
      console.error('Error signing up with email:', error)
      throw error
    }
    return data
  }

  const signInWithEmail = async (email: string, password: string) => {
    const trimmedEmail = email.trim()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })
    if (error) {
      console.error('Error signing in with email:', error)
      throw error
    }
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error)
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  }
}