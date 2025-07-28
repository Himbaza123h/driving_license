import { supabaseAdmin } from "../../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function POST(request) {
  console.log("🚀 LOGIN API: Starting login process")
  
  try {
    const body = await request.json()
    console.log("📥 LOGIN API: Request body received:", { 
      emailOrPhone: body.emailOrPhone, 
      passwordProvided: !!body.password 
    })

    const { emailOrPhone, password } = body

    if (!emailOrPhone || !password) {
      console.log("❌ LOGIN API: Missing required fields")
      return NextResponse.json(
        { error: 'Email/phone and password are required' },
        { status: 400 }
      )
    }

    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes('@')
    console.log("🔍 LOGIN API: Input type detected:", { isEmail, input: emailOrPhone })
    
    let email = emailOrPhone
    
    // If it's a phone number, format it and find the email
    if (!isEmail) {
      console.log("📱 LOGIN API: Processing phone number")
      
      // Format phone number to match database format
      let formattedPhone = emailOrPhone.trim()
      console.log("📱 LOGIN API: Original phone:", formattedPhone)
      
      // If phone doesn't start with +257, add it
      if (!formattedPhone.startsWith('+257')) {
        formattedPhone = '+257 ' + formattedPhone
        console.log("📱 LOGIN API: Added country code:", formattedPhone)
      }
      
      // Format to match the pattern +257 XX XXX XXX
      const digitsOnly = formattedPhone.replace(/\D/g, '').substring(3) // Remove +257
      console.log("📱 LOGIN API: Digits only (without country code):", digitsOnly)
      
      if (digitsOnly.length === 8) {
        formattedPhone = `+257 ${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2, 5)} ${digitsOnly.substring(5, 8)}`
        console.log("📱 LOGIN API: Final formatted phone:", formattedPhone)
      } else {
        console.log("❌ LOGIN API: Invalid phone number length:", digitsOnly.length)
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
      
      // Find user by phone number to get their email
      console.log("🔍 LOGIN API: Searching for user by phone number")
      const { data: userByPhone, error: phoneError } = await supabaseAdmin
        .from('users')
        .select('email, id, email_verified')
        .eq('phone_number', formattedPhone)
        .single()

      console.log("📊 LOGIN API: Phone lookup result:", { 
        found: !!userByPhone, 
        error: phoneError?.message,
        userEmail: userByPhone?.email,
        userId: userByPhone?.id,
        emailVerified: userByPhone?.email_verified
      })

      if (phoneError || !userByPhone) {
        console.log("❌ LOGIN API: No user found with phone number")
        return NextResponse.json(
          { error: 'No account found with this phone number' },
          { status: 404 }
        )
      }

      email = userByPhone.email
      console.log("✅ LOGIN API: Found email for phone:", email)
    }

    console.log("🔐 LOGIN API: Attempting Supabase auth with email:", email)

    // Now authenticate with email
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    console.log("🔐 LOGIN API: Supabase auth result:", {
      success: !!data?.user,
      userId: data?.user?.id,
      userEmail: data?.user?.email,
      userConfirmedAt: data?.user?.email_confirmed_at,
      error: error?.message,
      errorCode: error?.status
    })

    if (error) {
      console.log("❌ LOGIN API: Authentication error details:", {
        message: error.message,
        status: error.status,
        code: error.code
      })

      // Handle specific Supabase auth errors
      if (error.message.includes('Invalid login credentials')) {
        console.log("🔍 LOGIN API: Invalid credentials - checking if user exists")
        
        // Check if it's an email not found issue by trying to get user
        const { data: userExists, error: userCheckError } = await supabaseAdmin
          .from('users')
          .select('email, id, email_verified')
          .eq('email', email)
          .single()

        console.log("👤 LOGIN API: User existence check:", {
          exists: !!userExists,
          email: userExists?.email,
          id: userExists?.id,
          emailVerified: userExists?.email_verified,
          checkError: userCheckError?.message
        })

        if (!userExists) {
          console.log("❌ LOGIN API: User does not exist in database")
          return NextResponse.json(
            { error: isEmail ? 'No account found with this email address' : 'No account found with this phone number' },
            { status: 404 }
          )
        } else {
          console.log("❌ LOGIN API: User exists but password is incorrect")
          return NextResponse.json(
            { error: 'Password incorrect. Please try again' },
            { status: 401 }
          )
        }
      }
      
      // Handle email not confirmed
      if (error.message.includes('Email not confirmed')) {
        console.log("📧 LOGIN API: Email not confirmed error")
        return NextResponse.json(
          { error: 'Please verify your email before signing in. Check your inbox for a verification link.' },
          { status: 401 }
        )
      }

      // Handle rate limiting
      if (error.message.includes('Too many requests')) {
        console.log("⏰ LOGIN API: Rate limiting triggered")
        return NextResponse.json(
          { error: 'Too many login attempts. Please wait a moment and try again' },
          { status: 429 }
        )
      }

      // Handle signup not completed
      if (error.message.includes('Signup not completed')) {
        console.log("📝 LOGIN API: Signup not completed")
        return NextResponse.json(
          { error: 'Please complete your account verification. Check your email for a verification link.' },
          { status: 401 }
        )
      }

      // Generic error fallback
      console.log("❌ LOGIN API: Generic auth error")
      return NextResponse.json(
        { error: `Authentication failed: ${error.message}` },
        { status: 401 }
      )
    }

    console.log("✅ LOGIN API: Authentication successful, fetching user profile")

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    console.log("👤 LOGIN API: Profile fetch result:", {
      success: !!userProfile,
      profileId: userProfile?.id,
      profileEmail: userProfile?.email,
      profileName: userProfile?.full_name,
      profileRoles: userProfile?.roles,
      profileError: profileError?.message
    })

    if (profileError) {
      console.error('❌ LOGIN API: Profile fetch error:', profileError)
    }

    const response = {
      message: 'Login successful',
      user: data.user,
      profile: userProfile,
      session: data.session
    }

    console.log("✅ LOGIN API: Login completed successfully for user:", data.user.email)
    console.log("📤 LOGIN API: Sending response with user data")

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 LOGIN API: Unexpected error:', {
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}