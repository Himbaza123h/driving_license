import { createContext, useContext, useEffect, useState } from 'react'
import { supabaseAdmin } from "../../../../backend/config/database";

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabaseAdmin.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUserProfile(profile)
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setUserProfile(profile)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (userData) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return response.json()
  }

  const signIn = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    return response.json()
  }

  const signOut = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    return response.json()
  }

  const forgotPassword = async (email) => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    return response.json()
  }

  const resetPassword = async (password, access_token, refresh_token) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, access_token, refresh_token })
    })
    return response.json()
  }

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}