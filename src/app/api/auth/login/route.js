import { supabaseAdmin } from "../../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // First, check if user exists
    const {error: userCheckError } = await supabaseAdmin
      .from('auth.users')
      .select('email')
      .eq('email', email)
      .single()

    // If we can't find the user in auth.users, try a different approach
    if (userCheckError) {
      // Try to sign in and handle the specific error
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('Invalid login credentials')) {
          // Check if it's an email not found issue by trying to get user
          const { data: userExists } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('email', email)
            .single()

          if (!userExists) {
            return NextResponse.json(
              { error: 'No account found with this email address' },
              { status: 404 }
            )
          } else {
            return NextResponse.json(
              { error: 'Password incorrect. Please try again' },
              { status: 401 }
            )
          }
        }
        
        // Handle other auth errors
        if (error.message.includes('Email not confirmed')) {
          return NextResponse.json(
            { error: 'Please verify your email before signing in' },
            { status: 401 }
          )
        }

        if (error.message.includes('Too many requests')) {
          return NextResponse.json(
            { error: 'Too many login attempts. Please wait a moment and try again' },
            { status: 429 }
          )
        }

        // Generic error fallback
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }

      // If login successful, get user profile
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      return NextResponse.json({
        message: 'Login successful',
        user: data.user,
        profile: userProfile,
        session: data.session
      })
    }

    // If user exists, proceed with login
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Password incorrect. Please try again' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    return NextResponse.json({
      message: 'Login successful',
      user: data.user,
      profile: userProfile,
      session: data.session
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}