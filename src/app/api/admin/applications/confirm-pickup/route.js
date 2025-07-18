import { supabaseAdmin } from "../../../../../../backend/config/database";
import { NextResponse } from "next/server";

// Retry function for database operations
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`🔄 Attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries - 1) {
        throw error; // Last attempt failed
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

export async function POST(request) {
  console.log("🚀 Pickup API called - Starting request processing");
  
  try {
    const body = await request.json();
    console.log("📥 Request body received:", JSON.stringify(body, null, 2));
    
    const { applicationId, citizenId, pickupTime } = body;
    console.log("🔍 Extracted fields:", { applicationId, citizenId, pickupTime });

    // Validate required fields
    if (!applicationId || !citizenId || !pickupTime) {
      console.log("❌ Validation failed - Missing required fields");
      return NextResponse.json({
        success: false,
        error: "Missing required fields: applicationId, citizenId, and pickupTime are required"
      }, { status: 400 });
    }

    console.log("✅ All required fields present, proceeding with database query");

    // First, verify the application exists with retry logic
    console.log("🔍 Fetching application with ID:", applicationId);
    
    const { data: application, error: fetchError } = await retryOperation(async () => {
      return await supabaseAdmin
        .from("license_applications")
        .select("id, status, personal_info, license_type, submitted_at, created_at, picked_up, pickup_time")
        .eq("id", applicationId)
        .single();
    });

    console.log("📊 Fetch result:", {
      application: application ? {
        id: application.id,
        status: application.status,
        picked_up: application.picked_up,
        pickup_time: application.pickup_time
      } : null,
      fetchError: fetchError
    });

    if (fetchError) {
      console.error("❌ Error fetching application:", fetchError);
      return NextResponse.json({
        success: false,
        error: "Application not found or access denied"
      }, { status: 404 });
    }

    console.log("✅ Application found successfully");

    // Check if application is approved
    if (application.status?.toLowerCase() !== "approved") {
      console.log("❌ Application not approved. Current status:", application.status);
      return NextResponse.json({
        success: false,
        error: "Only approved applications can be marked as picked up"
      }, { status: 400 });
    }

    // Check if already picked up
    if (application.picked_up) {
      console.log("❌ License already picked up at:", application.pickup_time);
      return NextResponse.json({
        success: false,
        error: "License has already been picked up",
        data: { pickupTime: application.pickup_time }
      }, { status: 400 });
    }

    console.log("✅ License not yet picked up, proceeding with update");

    // Update the application with retry logic
    const updateData = {
      picked_up: true,
      pickup_time: pickupTime,
      updated_at: new Date().toISOString()
    };
    
    console.log("🔄 Updating application with data:", updateData);

    const { data: updatedApplication, error: updateError } = await retryOperation(async () => {
      return await supabaseAdmin
        .from("license_applications")
        .update(updateData)
        .eq("id", applicationId)
        .select("id, status, personal_info, license_type, submitted_at, created_at, picked_up, pickup_time")
        .single();
    });

    if (updateError) {
      console.error("❌ Error updating pickup status:", updateError);
      return NextResponse.json({
        success: false,
        error: "Failed to confirm pickup"
      }, { status: 500 });
    }

    console.log("✅ Pickup confirmed successfully!");
    return NextResponse.json({
      success: true,
      message: "License pickup confirmed successfully",
      data: updatedApplication
    });

  } catch (error) {
    console.error("💥 Unexpected error in confirm pickup API:", error);
    console.log("Error details:", {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}