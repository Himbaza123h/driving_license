import { supabaseAdmin } from "../../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { nationalId, otp, transactionId } = await request.json();

    if (!nationalId || !otp || !transactionId) {
      return NextResponse.json(
        { success: false, message: 'National ID, OTP, and transaction ID are required' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Verifying OTP:', { nationalId, otp, transactionId });

    // Get the auth session with citizen data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('auth_sessions')
      .select(`
        *,
        citizens (
          id,
          national_id,
          full_name,
          date_of_birth,
          address,
          phone_number,
          email,
          status
        )
      `)
      .eq('transaction_id', transactionId)
      .eq('status', 'PENDING')
      .single();

    if (sessionError || !session) {
      console.log('❌ API: Invalid transaction ID:', sessionError);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session. Please try again.' },
        { status: 400 }
      );
    }

    // Check if session is expired
    if (new Date() > new Date(session.otp_expires_at)) {
      console.log('❌ API: OTP expired');
      
      // Mark session as expired
      await supabaseAdmin
        .from('auth_sessions')
        .update({ status: 'EXPIRED' })
        .eq('id', session.id);

      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP (in development, accept any 6-digit code or the actual OTP)
    const isValidOTP = process.env.NODE_ENV === 'development' 
      ? (otp === session.otp_code || /^\d{6}$/.test(otp))
      : otp === session.otp_code;

    if (!isValidOTP) {
      console.log('❌ API: Invalid OTP');
      
      // Increment attempts
      const newAttempts = (session.attempts || 0) + 1;
      const updateData = { attempts: newAttempts };
      
      // Mark as failed after 3 attempts
      if (newAttempts >= 3) {
        updateData.status = 'FAILED';
      }

      await supabaseAdmin
        .from('auth_sessions')
        .update(updateData)
        .eq('id', session.id);

      return NextResponse.json(
        { 
          success: false, 
          message: newAttempts >= 3 
            ? 'Too many failed attempts. Please try again later.'
            : `Invalid OTP. ${3 - newAttempts} attempts remaining.`
        },
        { status: 400 }
      );
    }

    // Success! Mark session as verified
    await supabaseAdmin
      .from('auth_sessions')
      .update({ status: 'VERIFIED' })
      .eq('id', session.id);

    console.log('✅ API: OTP verification successful');

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      citizenData: {
        id: session.citizens.id,
        nationalId: session.citizens.national_id,
        fullName: session.citizens.full_name,
        dateOfBirth: session.citizens.date_of_birth,
        address: session.citizens.address,
        phoneNumber: session.citizens.phone_number,
        email: session.citizens.email,
        status: session.citizens.status
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ API: OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}