import { supabaseAdmin } from "../../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { emailOrPhone, password } = await request.json()

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { error: 'Email/phone and password are required' },
        { status: 400 }
      )
    }

    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes('@')
    let email = emailOrPhone
    
    // If it's a phone number, format it and find the email
    if (!isEmail) {
      // Format phone number to match database format
      let formattedPhone = emailOrPhone.trim()
      
      // If phone doesn't start with +257, add it
      if (!formattedPhone.startsWith('+257')) {
        formattedPhone = '+257 ' + formattedPhone
      }
      
      // Format to match the pattern +257 XX XXX XXX
      const digitsOnly = formattedPhone.replace(/\D/g, '').substring(3) // Remove +257
      if (digitsOnly.length === 8) {
        formattedPhone = `+257 ${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2, 5)} ${digitsOnly.substring(5, 8)}`
      }
      
      // Find user by phone number to get their email
      const { data: userByPhone, error: phoneError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('phone_number', formattedPhone)
        .single()

      if (phoneError || !userByPhone) {
        return NextResponse.json(
          { error: 'No account found with this phone number' },
          { status: 404 }
        )
      }

      email = userByPhone.email
    }

    // Now authenticate with email
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
            { error: isEmail ? 'No account found with this email address' : 'No account found with this phone number' },
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