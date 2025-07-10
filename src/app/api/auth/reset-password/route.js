import { supabaseAdmin } from "../../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { password, access_token, refresh_token } = await request.json()

    if (!password || !access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Password, access token, and refresh token are required' },
        { status: 400 }
      )
    }

    // Set the session using the tokens from the password reset email
    const {error: sessionError } = await supabaseAdmin.auth.setSession({
      access_token,
      refresh_token
    })

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 400 }
      )
    }

    // Update the password
    const { error: updateError } = await supabaseAdmin.auth.updateUser({
      password: password
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password updated successfully!'
    }, { status: 200 })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}