import { supabaseAdmin } from '../../../../../backend/config/database';
import { sendVerificationEmail } from "../../../../../backend/services/emailService";
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  console.log("🚀 RESEND VERIFICATION API: Starting resend process");
  
  try {
    const { userId } = await request.json();
    
    console.log("📥 RESEND VERIFICATION API: Request data:", { userId });

    if (!userId) {
      console.log("❌ RESEND VERIFICATION API: Missing userId");
      return NextResponse.json(
        { success: false, error: 'UserId is required' },
        { status: 400 }
      );
    }

    // Get user information
    console.log("🔍 RESEND VERIFICATION API: Looking up user");
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, id, email_verified')
      .eq('id', userId)
      .single();

    console.log("📊 RESEND VERIFICATION API: User lookup result:", {
      found: !!user,
      error: userError?.message,
      email: user?.email,
      emailVerified: user?.email_verified
    });

    if (userError || !user) {
      console.log("❌ RESEND VERIFICATION API: User not found");
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.email_verified) {
      console.log("✅ RESEND VERIFICATION API: Email already verified");
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    console.log("🔑 RESEND VERIFICATION API: Generating new token");
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Delete any existing tokens for this user first
    console.log("🗑️ RESEND VERIFICATION API: Cleaning up old tokens");
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('user_id', userId);

    // Store new verification token in database
    console.log("💾 RESEND VERIFICATION API: Storing new token");
    const { error: dbError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        user_id: userId,
        email: user.email,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
        used: false,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('❌ RESEND VERIFICATION API: Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create verification record' },
        { status: 500 }
      );
    }

    // Send verification email
    console.log("📧 RESEND VERIFICATION API: Sending email");
    const emailResult = await sendVerificationEmail(user.email, verificationToken, userId);

    console.log("📊 RESEND VERIFICATION API: Email send result:", {
      success: emailResult.success,
      error: emailResult.error
    });

    if (!emailResult.success) {
      console.log("❌ RESEND VERIFICATION API: Failed to send email");
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to send verification email' },
        { status: 500 }
      );
    }

    console.log("✅ RESEND VERIFICATION API: Verification email resent successfully");
    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully! Please check your inbox.'
    });

  } catch (error) {
    console.error('💥 RESEND VERIFICATION API: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}