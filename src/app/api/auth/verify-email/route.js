import { supabaseAdmin } from "../../../../../backend/config/database";
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log("🚀 VERIFY EMAIL API: Starting verification process");
  
  try {
    const { token, userId } = await request.json();
    
    console.log("📥 VERIFY EMAIL API: Request data:", { 
      tokenProvided: !!token, 
      userId: userId 
    });

    if (!token || !userId) {
      console.log("❌ VERIFY EMAIL API: Missing required fields");
      return NextResponse.json(
        { success: false, error: 'Token and userId are required' },
        { status: 400 }
      );
    }

    // Find verification record
    console.log("🔍 VERIFY EMAIL API: Looking for verification record");
    const { data: verification, error: findError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('token', token)
      .eq('used', false)
      .single();

    console.log("📊 VERIFY EMAIL API: Verification lookup result:", {
      found: !!verification,
      error: findError?.message,
      verificationId: verification?.id,
      email: verification?.email
    });

    if (findError || !verification) {
      console.log("❌ VERIFY EMAIL API: Invalid or expired verification token");
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    
    console.log("⏰ VERIFY EMAIL API: Checking token expiry:", {
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isExpired: now > expiresAt
    });
    
    if (now > expiresAt) {
      console.log("❌ VERIFY EMAIL API: Token has expired, deleting");
      // Delete expired token
      await supabaseAdmin
        .from('email_verifications')
        .delete()
        .eq('id', verification.id);
        
      return NextResponse.json(
        { success: false, error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // CRITICAL FIX: Update the user's email_confirmed_at in Supabase Auth
    console.log("🔐 VERIFY EMAIL API: Updating user email confirmation in Supabase Auth");
    console.log("🔐 VERIFY EMAIL API: User ID being updated:", userId);
    
    // First, let's check the current user state in Supabase Auth
    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    console.log("👤 VERIFY EMAIL API: Current user state before update:", {
      userExists: !!currentUser.user,
      email: currentUser.user?.email,
      emailConfirmedAt: currentUser.user?.email_confirmed_at,
      getUserError: getUserError?.message
    });

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true
      }
    );

    console.log("📊 VERIFY EMAIL API: Auth update result:", {
      success: !authUpdateError,
      error: authUpdateError?.message,
      errorDetails: authUpdateError
    });

    // Let's verify the update worked
    if (!authUpdateError) {
      const { data: updatedUser, error: getUpdatedUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      console.log("👤 VERIFY EMAIL API: User state after update:", {
        userExists: !!updatedUser.user,
        email: updatedUser.user?.email,
        emailConfirmedAt: updatedUser.user?.email_confirmed_at,
        getUpdatedUserError: getUpdatedUserError?.message
      });
    }

    if (authUpdateError) {
      console.error('❌ VERIFY EMAIL API: Error updating user email confirmation:', authUpdateError);
      return NextResponse.json(
        { success: false, error: 'Failed to confirm email in auth system' },
        { status: 500 }
      );
    }

    // Mark verification token as used
    console.log("✅ VERIFY EMAIL API: Marking verification token as used");
    const { error: updateTokenError } = await supabaseAdmin
      .from('email_verifications')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('id', verification.id);

    if (updateTokenError) {
      console.error('⚠️ VERIFY EMAIL API: Error updating verification token:', updateTokenError);
      // Don't fail here since the main auth update succeeded
    }

    // Update your users table email_verified flag
    console.log("📝 VERIFY EMAIL API: Updating users table");
    const { error: usersUpdateError } = await supabaseAdmin
      .from('users')
      .update({ 
        email_verified: true,
        email_verified_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (usersUpdateError) {
      console.error('⚠️ VERIFY EMAIL API: Error updating users table:', usersUpdateError);
      // Don't fail here since the main auth update succeeded
    }

    console.log("✅ VERIFY EMAIL API: Email verification completed successfully");
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.'
    });

  } catch (error) {
    console.error('💥 VERIFY EMAIL API: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}