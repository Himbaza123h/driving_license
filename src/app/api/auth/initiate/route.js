import { supabaseAdmin } from "../../../../../backend/config/database"
import { NextResponse } from 'next/server'

// Initialize supabaseAdmin with service role key for backend operations

// Helper functions
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateTransactionId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request) {
  try {
    const { nationalId } = await request.json();

    if (!nationalId) {
      return NextResponse.json(
        { success: false, message: 'National ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Looking up National ID:', nationalId);

    // Look up citizen in supabaseAdmin
    const { data: citizen, error } = await supabaseAdmin
      .from('citizens')
      .select('*')
      .eq('national_id', nationalId)
      .eq('status', 'ACTIVE')
      .single();

    if (error) {
      console.log('❌ API: supabaseAdmin error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'National ID not found. Please check and try again.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!citizen) {
      console.log('❌ API: No citizen found for National ID:', nationalId);
      return NextResponse.json(
        { success: false, message: 'National ID not found. Please check and try again.' },
        { status: 404 }
      );
    }

    console.log('✅ API: Citizen found:', citizen.full_name);

    // Generate OTP and transaction ID
    const otp = generateOTP();
    const transactionId = generateTransactionId();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP session in supabaseAdmin
    const { error: sessionError } = await supabaseAdmin
      .from('auth_sessions')
      .insert({
        citizen_id: citizen.id,
        transaction_id: transactionId,
        otp_code: otp,
        otp_expires_at: expiresAt.toISOString(),
        status: 'PENDING'
      });

    if (sessionError) {
      console.error('❌ API: Failed to create auth session:', sessionError);
      return NextResponse.json(
        { success: false, message: 'Failed to initiate authentication. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`📱 API: OTP generated: ${otp} (expires: ${expiresAt.toLocaleTimeString()})`);

    // In development, return the OTP for testing
    const responseData = {
      success: true,
      message: `OTP sent to ${citizen.phone_number}`,
      transactionId,
      ...(process.env.NODE_ENV === 'development' && { otp })
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('❌ API: Auth initiation error:', error);
    return NextResponse.json(
      { success: false, message: 'Connection error. Please try again.' },
      { status: 500 }
    );
  }
}