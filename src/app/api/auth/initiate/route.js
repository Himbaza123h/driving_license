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
    const { nationalId, email } = await request.json();

    if (!nationalId && !email) {
      return NextResponse.json(
        { success: false, message: 'National ID or email is required' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Looking up with National ID:', nationalId, 'Email:', email);

    // First, try to find citizen by both email and national ID
    let citizen = null;
    let citizenError = null;

    // Check if both email and national ID match
    if (email && nationalId) {
      const { data: citizenByBoth, error: bothError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("national_id", nationalId)
        .eq("email", email)
        
        .single();

      if (!bothError && citizenByBoth) {
        console.log("✅ API: Found citizen with both email and national ID match");
        citizen = citizenByBoth;
        citizenError = null;
      } else {
        // Try matching by email only
        const { data: citizenByEmail, error: emailError } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("email", email)
          
          .single();

        if (!emailError && citizenByEmail) {
          console.log("✅ API: Found citizen with email match");
          citizen = citizenByEmail;
          citizenError = null;
        } else {
          // Try matching by national ID only
          const { data: citizenByNationalId, error: nationalIdError } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("national_id", nationalId)
            .single();

          if (!nationalIdError && citizenByNationalId) {
            console.log("✅ API: Found citizen with national ID match");
            citizen = citizenByNationalId;
            citizenError = null;
          } else {
            citizen = null;
            citizenError = nationalIdError;
          }
        }
      }
    } else if (email) {
      // Only check by email
      const { data: citizenByEmail, error: emailError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      citizen = citizenByEmail;
      citizenError = emailError;
    } else {
      // Only check by national ID
      const { data: citizenByNationalId, error: nationalIdError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("national_id", nationalId)  
        .single();

      citizen = citizenByNationalId;
      citizenError = nationalIdError;
    }

    // Fallback approach if citizen not found and national ID is longer than 13 digits
    if (citizenError && nationalId && nationalId.length > 13) {
      const truncatedNationalId = nationalId.substring(0, 13);
      console.log('=== TRYING TRUNCATED NATIONAL ID ===');
      console.log('Original National ID:', nationalId);
      console.log('Truncated to 13 digits:', truncatedNationalId);

      const { data: truncatedCitizen, error: truncatedError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("national_id", truncatedNationalId)
        .single();

      if (!truncatedError && truncatedCitizen) {
        console.log('✅ API: Found citizen with truncated national ID');
        citizen = truncatedCitizen;
        citizenError = null;
      } else {
        console.log('❌ API: No citizen found with truncated national ID either');
      }
    }

    if (citizenError || !citizen) {
      console.log('❌ API: No citizen found for provided credentials');
      
      if (citizenError && citizenError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'National ID or email not found. Please check and try again.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Citizen not found with this national ID or email' },
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