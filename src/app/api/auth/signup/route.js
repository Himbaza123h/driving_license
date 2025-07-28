import { supabaseAdmin } from "../../../../../backend/config/database";
import { sendVerificationEmail } from "@/utils/emailService";
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  console.log('=== SIGNUP REQUEST START ===');
  
  try {
    const body = await request.json();
    const { email, password, fullName, nationalId, phoneNumber } = body;

    console.log('Request payload:', {
      fullName,
      email,
      nationalId,
      phoneNumber,
      password: '***'
    });

    // Validation
    if (!email || !password || !fullName || !nationalId || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Clean and validate email
    const cleanedEmail = email.toLowerCase().trim();
    console.log('📧 Email validation:', { original: email, cleaned: cleanedEmail });

    // Process national ID
    const processedNationalId = nationalId.replace(/\s+/g, '');
    console.log('🔢 National ID processing:', { original: nationalId, processed: processedNationalId });

    // Check for existing user with email (check both users table and auth.users)
    console.log('🔍 Checking for existing user with email...');
    
    // Check users table
    const { data: existingUserByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', cleanedEmail)
      .single();

    if (existingUserByEmail) {
      console.log('❌ User with email already exists in users table');
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Also check auth.users table
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const authUserExists = existingAuthUser?.users?.find(user => user.email === cleanedEmail);
    
    if (authUserExists) {
      console.log('❌ Auth user with email already exists');
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    console.log('✅ No existing user found with email');

    // Check for existing user with national ID
    console.log('🔍 Checking for existing user with national ID...');
    const { data: existingUserByNationalId } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('national_id', processedNationalId)
      .single();

    if (existingUserByNationalId) {
      console.log('❌ User with national ID already exists');
      return NextResponse.json(
        { success: false, error: 'User with this National ID already exists' },
        { status: 400 }
      );
    }
    console.log('✅ No existing user found with national ID');

    // Check for existing user with phone number
    console.log('🔍 Checking for existing user with phone number...');
    const { data: existingUserByPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUserByPhone) {
      console.log('❌ User with phone number already exists');
      return NextResponse.json(
        { success: false, error: 'User with this phone number already exists' },
        { status: 400 }
      );
    }
    console.log('✅ No existing user found with phone number');

    // Check for existing citizen
    console.log('🔍 Checking for existing citizen...');
    const { data: existingCitizen } = await supabaseAdmin
      .from('citizens')
      .select('id')
      .eq('national_id', processedNationalId)
      .single();

    if (existingCitizen) {
      console.log('❌ Citizen with national ID already exists');
      return NextResponse.json(
        { success: false, error: 'Citizen with this National ID already exists' },
        { status: 400 }
      );
    }
    console.log('✅ No existing citizen found');

    // Create auth user using admin API (like before)
    console.log('👤 Creating auth user...');
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanedEmail,
      password: password,
      email_confirm: false, // Disable automatic email confirmation
      user_metadata: {
        full_name: fullName,
        national_id: processedNationalId,
        phone_number: phoneNumber
      }
    });

    if (authError) {
      console.log('❌ Auth user creation error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    console.log('✅ Auth user created successfully:', authData.user.id);

    // Update/Insert user record in users table
    console.log('📝 Updating user record in users table...');
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email: cleanedEmail,
        full_name: fullName,
        national_id: processedNationalId,
        phone_number: phoneNumber,
        roles: 'user',
        email_verified: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (userError) {
      console.log('❌ User table upsert error:', userError);
      
      // If it's still a duplicate error, someone else created this user
      if (userError.code === '23505') {
        console.log('❌ User record already exists - cleaning up auth user');
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { success: false, error: 'User with this information already exists' },
          { status: 400 }
        );
      }
      
      // Other errors - cleanup and return error
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: 'Failed to create user record' },
        { status: 500 }
      );
    }
    console.log('✅ User record created/updated successfully');

    // Create citizen record
    console.log('👥 Creating citizen record...');
    const citizenData = {
      national_id: processedNationalId,
      full_name: fullName,
      date_of_birth: '2000-01-01',
      address: 'Burundi, Bujumbura',
      phone_number: phoneNumber,
      email: cleanedEmail,
      photo_url: null,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newCitizen, error: citizenError } = await supabaseAdmin
      .from('citizens')
      .insert(citizenData)
      .select()
      .single();

    if (citizenError) {
      console.log('❌ Citizen creation error:', citizenError);
      // Clean up auth user and user record
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
      return NextResponse.json(
        { success: false, error: 'Failed to create citizen record' },
        { status: 500 }
      );
    }

    console.log('✅ Citizen record created successfully:', newCitizen);

    // Create user permissions
    console.log('🔐 Creating user permissions...');
    const permissionsData = {
      citizen_id: newCitizen.id,
      national_id: processedNationalId,
      email: cleanedEmail,
      email_permission: false,
      birthdate_permission: false,
      gender_permission: false,
      name_permission: false,
      phone_number_permission: false,
      picture_permission: false,
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: permissionsError } = await supabaseAdmin
      .from('user_permissions')
      .insert(permissionsData);

    if (permissionsError) {
      console.log('❌ Permissions creation error:', permissionsError);
      console.log('⚠️ Continuing without permissions (non-critical error)');
    } else {
      console.log('✅ User permissions created successfully');
    }

    // Generate verification token and send email
    console.log('📧 Preparing email verification...');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store verification token in database
    const { error: verificationError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        user_id: authData.user.id,
        email: cleanedEmail,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
        used: false,
        created_at: new Date().toISOString()
      });

    let emailSent = false;
    if (verificationError) {
      console.log('⚠️ Verification token creation error:', verificationError);
    } else {
      console.log('✅ Verification token created');
      
      // Send verification email
      try {
        const emailResult = await sendVerificationEmail(cleanedEmail, verificationToken, authData.user.id);
        if (emailResult.success) {
          console.log('✅ Verification email sent successfully');
          emailSent = true;
        } else {
          console.log('⚠️ Failed to send verification email:', emailResult.error);
        }
      } catch (emailError) {
        console.log('⚠️ Email sending error:', emailError);
      }
    }

    console.log('=== SIGNUP REQUEST END ===');

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Account created successfully! Please check your email for verification.' 
        : 'Account created successfully! Email verification will be sent shortly.',
      user: {
        id: authData.user.id,
        email: cleanedEmail,
        name: fullName,
        emailVerified: false
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Signup error:', error);
    console.log('=== SIGNUP REQUEST END (ERROR) ===');
    
    return NextResponse.json(
      { success: false, error: 'Internal server error during signup' },
      { status: 500 }
    );
  }
}