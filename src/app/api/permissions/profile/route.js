import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../backend/config/database";

// Save or update permissions for a phone number
export async function POST(request) {
  try {
    const body = await request.json();
    const { nationalId, permissions, email } = body;

    // Validate required fields
    if (!nationalId || !permissions) {
      return NextResponse.json(
        {
          success: false,
          message: "National ID and permissions are required",
          error: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Validate permissions object structure
    const requiredPermissions = [
      "email",
      "birthdate",
      "gender",
      "name",
      "phoneNumber",
      "picture",
    ];
    const hasAllPermissions = requiredPermissions.every(
      (perm) =>
        permissions.hasOwnProperty(perm) &&
        typeof permissions[perm] === "boolean"
    );

    if (!hasAllPermissions) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid permissions format. Required: email, birthdate, gender, name, phoneNumber, picture (all boolean)",
          error: "INVALID_PERMISSIONS_FORMAT",
        },
        { status: 400 }
      );
    }

    console.log("Processing permissions for national ID:", nationalId);
    console.log("Email:", email);
    console.log("Permissions:", permissions);

    // First, try to find citizen by both email and national ID
    let citizen = null;
    let citizenError = null;

    // Build query conditions
    let query = supabaseAdmin
      .from("citizens")
      .select("id, national_id, full_name, phone_number, email");

    // Check if both email and national ID match
    if (email) {
      const { data: citizenByBoth, error: bothError } = await query
        .eq("national_id", nationalId)
        .eq("email", email)
        .single();

      if (!bothError && citizenByBoth) {
        console.log("Found citizen with both email and national ID match");
        citizen = citizenByBoth;
        citizenError = null;
      } else {
        // Try matching by email only
        const { data: citizenByEmail, error: emailError } = await supabaseAdmin
          .from("citizens")
          .select("id, national_id, full_name, phone_number, email")
          .eq("email", email)
          .single();

        if (!emailError && citizenByEmail) {
          console.log("Found citizen with email match");
          citizen = citizenByEmail;
          citizenError = null;
        } else {
          // Try matching by national ID only
          const { data: citizenByNationalId, error: nationalIdError } = await supabaseAdmin
            .from("citizens")
            .select("id, national_id, full_name, phone_number, email")
            .eq("national_id", nationalId)
            .single();

          if (!nationalIdError && citizenByNationalId) {
            console.log("Found citizen with national ID match");
            citizen = citizenByNationalId;
            citizenError = null;
          } else {
            citizen = null;
            citizenError = nationalIdError;
          }
        }
      }
    } else {
      // Only check by national ID if no email provided
      const { data: citizenByNationalId, error: nationalIdError } = await supabaseAdmin
        .from("citizens")
        .select("id, national_id, full_name, phone_number, email")
        .eq("national_id", nationalId)
        .single();

      citizen = citizenByNationalId;
      citizenError = nationalIdError;
    }

    // Fallback approach if citizen not found and national ID is longer than 13 digits
    if (citizenError && nationalId.length > 13) {
      const truncatedNationalId = nationalId.substring(0, 13);
      console.log('=== TRYING TRUNCATED NATIONAL ID ===');
      console.log('Original National ID:', nationalId);
      console.log('Truncated to 13 digits:', truncatedNationalId);

      const { data: truncatedCitizen, error: truncatedError } = await supabaseAdmin
        .from("citizens")
        .select("id, national_id, full_name, phone_number, email")
        .eq("national_id", truncatedNationalId)
        .single();

      if (!truncatedError && truncatedCitizen) {
        console.log('Found citizen with truncated national ID');
        citizen = truncatedCitizen;
        citizenError = null;
      } else {
        console.log('No citizen found with truncated national ID either');
      }
    }

    if (citizenError || !citizen) {
      console.error("Citizen not found:", citizenError);
      return NextResponse.json(
        {
          success: false,
          message: "Citizen not found with this national ID or email",
          error: "CITIZEN_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Check if permissions already exist for this citizen
    const { data: existingPermissions, error: checkError } = await supabaseAdmin
      .from("user_permissions")
      .select("id, created_at")
      .eq("citizen_id", citizen.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine for new permissions
      console.error("Error checking existing permissions:", checkError);
      return NextResponse.json(
        {
          success: false,
          message: "Database error while checking existing permissions",
          error: "DATABASE_ERROR",
        },
        { status: 500 }
      );
    }

    const permissionsData = {
      citizen_id: citizen.id,
      national_id: nationalId, // Use original national ID
      email_permission: permissions.email,
      birthdate_permission: permissions.birthdate,
      gender_permission: permissions.gender,
      name_permission: permissions.name,
      phone_number_permission: permissions.phoneNumber,
      picture_permission: permissions.picture,
      updated_at: new Date().toISOString(),
    };

    let result;
    let isUpdate = false;

    if (existingPermissions) {
      // Update existing permissions
      console.log("Updating existing permissions for citizen:", citizen.id);
      const { data, error } = await supabaseAdmin
        .from("user_permissions")
        .update(permissionsData)
        .eq("citizen_id", citizen.id)
        .select()
        .single();

      result = { data, error };
      isUpdate = true;
    } else {
      // Insert new permissions
      console.log("Creating new permissions for citizen:", citizen.id);
      const { data, error } = await supabaseAdmin
        .from("user_permissions")
        .insert({
          ...permissionsData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      result = { data, error };
      isUpdate = false;
    }

    if (result.error) {
      console.error("Error saving permissions:", result.error);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to ${isUpdate ? "update" : "save"} permissions`,
          error: "PERMISSIONS_SAVE_FAILED",
        },
        { status: 500 }
      );
    }

    console.log(
      `Permissions ${isUpdate ? "updated" : "saved"} successfully:`,
      result.data
    );

    return NextResponse.json({
      success: true,
      message: `Permissions ${isUpdate ? "updated" : "saved"} successfully`,
      isUpdate: isUpdate,
      data: {
        id: result.data.id,
        citizenId: result.data.citizen_id,
        nationalId: result.data.national_id,
        permissions: {
          email: result.data.email_permission,
          birthdate: result.data.birthdate_permission,
          gender: result.data.gender_permission,
          name: result.data.name_permission,
          phoneNumber: result.data.phone_number_permission,
          picture: result.data.picture_permission,
        },
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at,
      },
      citizen: {
        id: citizen.id,
        nationalId: citizen.national_id,
        fullName: citizen.full_name,
        phoneNumber: citizen.phone_number,
        email: citizen.email,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// Get permissions for a phone number
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nationalId = searchParams.get("nationalId");
    const email = searchParams.get("email");

    if (!nationalId && !email) {
      return NextResponse.json(
        {
          success: false,
          message: "National ID or email is required",
          error: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // First, try to find citizen by both email and national ID
    let citizen = null;
    let citizenError = null;

    // Check if both email and national ID match
    if (email && nationalId) {
      const { data: citizenByBoth, error: bothError } = await supabaseAdmin
        .from("citizens")
        .select("id, national_id, full_name, phone_number, email")
        .eq("national_id", nationalId)
        .eq("email", email)
        .single();

      if (!bothError && citizenByBoth) {
        console.log("Found citizen with both email and national ID match");
        citizen = citizenByBoth;
        citizenError = null;
      } else {
        // Try matching by email only
        const { data: citizenByEmail, error: emailError } = await supabaseAdmin
          .from("citizens")
          .select("id, national_id, full_name, phone_number, email")
          .eq("email", email)
          .single();

        if (!emailError && citizenByEmail) {
          console.log("Found citizen with email match");
          citizen = citizenByEmail;
          citizenError = null;
        } else {
          // Try matching by national ID only
          const { data: citizenByNationalId, error: nationalIdError } = await supabaseAdmin
            .from("citizens")
            .select("id, national_id, full_name, phone_number, email")
            .eq("national_id", nationalId)
            .single();

          if (!nationalIdError && citizenByNationalId) {
            console.log("Found citizen with national ID match");
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
        .from("citizens")
        .select("id, national_id, full_name, phone_number, email")
        .eq("email", email)
        .single();

      citizen = citizenByEmail;
      citizenError = emailError;
    } else {
      // Only check by national ID
      const { data: citizenByNationalId, error: nationalIdError } = await supabaseAdmin
        .from("citizens")
        .select("id, national_id, full_name, phone_number, email")
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
        .from("citizens")
        .select("id, national_id, full_name, phone_number, email")
        .eq("national_id", truncatedNationalId)
        .single();

      if (!truncatedError && truncatedCitizen) {
        console.log('Found citizen with truncated national ID');
        citizen = truncatedCitizen;
        citizenError = null;
      } else {
        console.log('No citizen found with truncated national ID either');
      }
    }

    if (citizenError || !citizen) {
      return NextResponse.json(
        {
          success: false,
          message: "Citizen not found with this national ID or email",
          error: "CITIZEN_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Get permissions for this citizen
    const { data: permissions, error: permissionsError } = await supabaseAdmin
      .from("user_permissions")
      .select("*")
      .eq("citizen_id", citizen.id)
      .single();

    if (permissionsError && permissionsError.code !== "PGRST116") {
      console.error("Error fetching permissions:", permissionsError);
      return NextResponse.json(
        {
          success: false,
          message: "Database error while fetching permissions",
          error: "DATABASE_ERROR",
        },
        { status: 500 }
      );
    }

    if (!permissions) {
      return NextResponse.json(
        {
          success: false,
          message: "No permissions found for this citizen",
          error: "PERMISSIONS_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Permissions retrieved successfully",
      data: {
        id: permissions.id,
        citizenId: permissions.citizen_id,
        nationalId: permissions.national_id,
        permissions: {
          email: permissions.email_permission,
          birthdate: permissions.birthdate_permission,
          gender: permissions.gender_permission,
          name: permissions.name_permission,
          phoneNumber: permissions.phone_number_permission,
          picture: permissions.picture_permission,
        },
        createdAt: permissions.created_at,
        updatedAt: permissions.updated_at,
      },
      citizen: {
        id: citizen.id,
        nationalId: citizen.national_id,
        fullName: citizen.full_name,
        phoneNumber: citizen.phone_number,
        email: citizen.email,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}