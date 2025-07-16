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

  const enrichUserWithProfile = (supabaseUser, profile) => {
    if (!supabaseUser) return null;
    
    return {
      ...supabaseUser,
      roles: profile?.roles || "user",
      // Add other profile fields you want directly accessible on user
      name: profile?.full_name || profile?.name || supabaseUser.email?.split("@")[0] || "User",
      nationalId: profile?.national_id,
      phoneNumber: profile?.phone_number,
      // Add any other fields you need from the profile
    }
  }

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabaseAdmin.auth.getSession()
      
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUserProfile(profile)
        setUser(enrichUserWithProfile(session.user, profile))
      } else {
        setUser(null)
        setUserProfile(null)
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUserProfile(profile)
          setUser(enrichUserWithProfile(session.user, profile))
        } else {
          setUserProfile(null)
          setUser(null)
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
    
    const result = await response.json()
    
    // If login is successful, the auth state change will trigger automatically
    // and fetch the user profile, so we don't need to manually set user here
    
    return result
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
    user, // Now includes roles and other profile data
    userProfile, // Still available for complete profile access
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