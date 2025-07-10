import { supabaseAdmin } from "../../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { error } = await supabaseAdmin.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}