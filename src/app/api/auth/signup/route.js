import { supabaseAdmin } from "../../../../../backend/config/database";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { fullName, email, nationalId, phoneNumber, password } =
      await request.json();

    // Validate required fields
    if (!fullName || !email || !nationalId || !phoneNumber || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate National ID format (13-16 digits)
    const nationalIdRegex = /^[0-9]{13,16}$/;
    if (!nationalIdRegex.test(nationalId)) {
      return NextResponse.json(
        { error: "National ID must be 13-16 digits" },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+257 [0-9]{2} [0-9]{3} [0-9]{3}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Phone number must be in format +257 XX XXX XXX" },
        { status: 400 }
      );
    }

    // Check if email already exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin
      .from("auth.users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingAuthUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check if user already exists in our users table by national_id or phone_number
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("national_id, phone_number, email")
      .or(`national_id.eq.${nationalId},phone_number.eq.${phoneNumber}`)
      .single();

    if (existingUser) {
      if (existingUser.national_id === nationalId) {
        return NextResponse.json(
          { error: "User with this National ID already exists" },
          { status: 409 }
        );
      }
      if (existingUser.phone_number === phoneNumber) {
        return NextResponse.json(
          { error: "User with this phone number already exists" },
          { status: 409 }
        );
      }
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signUp({
        email,
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
      // Handle specific Supabase auth errors
      if (authError.message.includes("User already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      if (
        authError.message.includes("Password should be at least 6 characters")
      ) {
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

    // If user was created successfully, also create a record in users table
    if (authData.user) {
      const { error: userTableError } = await supabaseAdmin
        .from("users")
        .insert({
          id: authData.user.id,
          full_name: fullName,
          email: email,
          national_id: nationalId,
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (userTableError) {
        console.error("User table insert error:", userTableError);
        // Note: Auth user is already created, so we log the error but don't fail the request
      }
    }

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
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
