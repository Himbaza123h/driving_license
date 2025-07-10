import { supabaseAdmin } from "../../../../../backend/config/database";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { fullName, email, nationalId, phoneNumber, password } =
      await request.json();

    console.log("=== SIGNUP REQUEST START ===");
    console.log("Request payload:", { fullName, email, nationalId, phoneNumber, password: "***" });

    // Validate required fields
    if (!fullName || !email || !nationalId || !phoneNumber || !password) {
      console.log("❌ Validation failed: Missing required fields");
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Clean and validate email
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      console.log("❌ Email validation failed:", cleanEmail);
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Log the cleaned email for debugging
    console.log("📧 Email validation:", { original: email, cleaned: cleanEmail });

    // Validate National ID format (13-16 digits)
    const nationalIdRegex = /^[0-9]{13,16}$/;
    if (!nationalIdRegex.test(nationalId)) {
      console.log("❌ National ID validation failed:", nationalId);
      return NextResponse.json(
        { error: "National ID must be 13-16 digits" },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+257 [0-9]{2} [0-9]{3} [0-9]{3}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.log("❌ Phone number validation failed:", phoneNumber);
      return NextResponse.json(
        { error: "Phone number must be in format +257 XX XXX XXX" },
        { status: 400 }
      );
    }

    // Process National ID
    const limitNationalId = (nationalId) => {
      if (!nationalId) return nationalId;
      // Remove all non-digit characters
      const digitsOnly = nationalId.replace(/\D/g, "");
      // Return first 13 digits only
      return digitsOnly.substring(0, 13);
    };

    const processedNationalId = limitNationalId(nationalId);
    console.log("🔢 National ID processing:", { original: nationalId, processed: processedNationalId });

    // Check if user already exists in our users table by email
    console.log("🔍 Checking for existing user with email...");
    const { data: existingUserByEmail } = await supabaseAdmin
      .from("users")
      .select("email, national_id, phone_number")
      .eq("email", cleanEmail)
      .single();

    if (existingUserByEmail) {
      console.log("❌ User with email already exists:", existingUserByEmail);
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    console.log("✅ No existing user found with email");

    // Check if user already exists in our users table by national_id
    console.log("🔍 Checking for existing user with national ID...");
    const { data: existingUserByNationalId } = await supabaseAdmin
      .from("users")
      .select("national_id, email, full_name")
      .eq("national_id", nationalId)
      .single();

    if (existingUserByNationalId) {
      console.log("❌ User with national ID already exists:", existingUserByNationalId);
      return NextResponse.json(
        { error: "User with this National ID already exists" },
        { status: 409 }
      );
    }
    console.log("✅ No existing user found with national ID");

    // Check if user already exists in our users table by phone number
    console.log("🔍 Checking for existing user with phone number...");
    const { data: existingUserByPhone } = await supabaseAdmin
      .from("users")
      .select("phone_number, email, full_name")
      .eq("phone_number", phoneNumber)
      .single();

    if (existingUserByPhone) {
      console.log("❌ User with phone number already exists:", existingUserByPhone);
      return NextResponse.json(
        { error: "User with this phone number already exists" },
        { status: 409 }
      );
    }
    console.log("✅ No existing user found with phone number");

    // Check if citizen already exists
    console.log("🔍 Checking for existing citizen...");
    const { data: existingCitizen } = await supabaseAdmin
      .from("citizens")
      .select("national_id")
      .eq("national_id", processedNationalId)
      .single();

    if (existingCitizen) {
      console.log("❌ Citizen already exists:", existingCitizen);
      return NextResponse.json(
        { error: "Citizen with this National ID already exists" },
        { status: 409 }
      );
    }
    console.log("✅ No existing citizen found");

    // Create user with Supabase Auth
    console.log("👤 Creating auth user...");
    console.log("Auth signup data:", { 
      email: cleanEmail, 
      password: password ? "***" : "missing",
      userData: {
        full_name: fullName,
        national_id: nationalId,
        phone_number: phoneNumber,
      }
    });

    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          national_id: nationalId,
          phone_number: phoneNumber,
        },
      },
    });

    if (authError) {
      console.log("❌ Auth creation failed:", authError);
      console.log("Auth error details:", JSON.stringify(authError, null, 2));
      
      // Handle specific Supabase auth errors
      if (authError.message.includes("User already registered") || 
          authError.code === 'email_address_invalid' || 
          authError.message.includes("already registered") ||
          authError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      if (authError.message.includes("Database error saving new user") ||
          authError.code === 'unexpected_failure') {
        return NextResponse.json(
          { error: "User with this information already exists" },
          { status: 409 }
        );
      }

      if (authError.message.includes("Password should be at least 6 characters")) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }

      if (authError.message.includes("Invalid email")) {
        return NextResponse.json(
          { error: "Please enter a valid email address" },
          { status: 400 }
        );
      }

      // Generic error fallback
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    console.log("✅ Auth user created successfully:", authData.user?.id);

    // If user was created successfully, also create a record in users table
    if (authData.user) {
      console.log("📝 Creating user record in users table...");
      const { error: userTableError } = await supabaseAdmin
        .from("users")
        .insert({
          id: authData.user.id,
          full_name: fullName,
          email: cleanEmail,
          national_id: nationalId,
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (userTableError) {
        console.error("❌ User table insert error:", userTableError);
        console.error("User table error details:", JSON.stringify(userTableError, null, 2));
        // Note: Auth user is already created, so we log the error but don't fail the request
      } else {
        console.log("✅ User record created successfully");
      }

      // Create citizen record
      console.log("👥 Creating citizen record...");
      console.log("Citizen data to insert:", {
        national_id: processedNationalId,
        full_name: fullName,
        date_of_birth: "2000-01-01",
        address: "Burundi, Bujumbura",
        phone_number: phoneNumber,
        email: cleanEmail,
        photo_url: null,
        status: "ACTIVE"
      });

      const { data: citizenData, error: citizenError } = await supabaseAdmin
        .from("citizens")
        .insert({
          national_id: processedNationalId,
          full_name: fullName,
          date_of_birth: "2000-01-01",
          address: "Burundi, Bujumbura",
          phone_number: phoneNumber,
          email: cleanEmail,
          photo_url: null,
          status: "ACTIVE",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (citizenError) {
        console.error("❌ Citizen insert error:", citizenError);
        console.error("Citizen error details:", JSON.stringify(citizenError, null, 2));
        // Note: Auth user is already created, so we log the error but don't fail the request
      } else {
        console.log("✅ Citizen record created successfully:", citizenData);
      }

      // Create user permissions only if citizen was created successfully
      if (citizenData) {
        console.log("🔐 Creating user permissions...");
        console.log("Permissions data to insert:", {
          citizen_id: citizenData.id,
          national_id: processedNationalId,
          email_permission: false,
          birthdate_permission: false,
          gender_permission: false,
          name_permission: false,
          phone_number_permission: false,
          picture_permission: false,
          is_verified: false
        });

        const { error: permissionsError } = await supabaseAdmin
          .from("user_permissions")
          .insert({
            citizen_id: citizenData.id,
            national_id: processedNationalId,
            email: cleanEmail,
            email_permission: false,
            birthdate_permission: false,
            gender_permission: false,
            name_permission: false,
            phone_number_permission: false,
            picture_permission: false,
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (permissionsError) {
          console.error("❌ Permissions insert error:", permissionsError);
          console.error("Permissions error details:", JSON.stringify(permissionsError, null, 2));
          // Note: Auth user is already created, so we log the error but don't fail the request
        } else {
          console.log("✅ User permissions created successfully");
        }
      } else {
        console.log("⚠️ Skipping permissions creation - no citizen data");
      }
    }

    console.log("=== SIGNUP REQUEST END ===");
    return NextResponse.json(
      {
        message:
          "User created successfully! Please check your email for verification.",
        user: authData.user,
        session: authData.session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("💥 Signup error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}