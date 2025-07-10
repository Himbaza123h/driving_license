import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../backend/config/database";



export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Checking verification status for email:', email);

    // Check if user exists in user_permissions table and is verified
    const { data, error } = await supabaseAdmin
      .from('user_permissions')
      .select('national_id, is_verified')
      .eq('email', email)
      .single();

    if (error) {
      console.log('User not found in permissions table:', error.message);
      return NextResponse.json(
        { isVerified: false },
        { status: 200 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { isVerified: false },
        { status: 200 }
      );
    }

    console.log('User verification data:', data);

    return NextResponse.json({
      isVerified: data.is_verified || false,
      nationalId: data.national_id
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}