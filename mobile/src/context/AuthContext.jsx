import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        setLoading(false)

        if (event === 'TOKEN_REFRESHED' && !s) {
          setSession(null)
          setUser(null)
        }
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password, displayName) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
