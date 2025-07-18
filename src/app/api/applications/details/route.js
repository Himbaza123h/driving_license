import { supabaseAdmin } from "../../../../../backend/config/database";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { applicationId, citizenId } = body;

    if (!applicationId || !citizenId) {
      return NextResponse.json(
        {
          success: false,
          error: "Application ID and Citizen ID are required",
        },
        { status: 400 }
      );
    }

    // Fetch the specific application from the database
    const { data: application, error } = await supabaseAdmin
      .from("license_applications")
      .select(
        `id,
        citizen_id,
        license_type,
        status,
        personal_info,
        documents,
        emergency_contact,
        review_notes,
        submitted_at,
        approved_at,
        rejected_at,
        created_at,
        picked_up,
        pickup_time,
        updated_at,
        photos
        `
      )
      .eq("id", applicationId)
      .single();

    console.log("This is application", application);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Application not found or you do not have permission to view it",
          },
          { status: 404 }
        );
      }

      console.error("Database error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch application from database",
        },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 }
      );
    }
    // Fetch QR code data if it exists
    let qrCodeData = null;
    if (application.id) {
      const { data: qrCodes, error: qrError } = await supabaseAdmin
        .from("qr_codes")
        .select(
          `
    license_number,
    qr_code_image,
    qr_code_data,
    issue_date,
    expiry_date,
    created_at,
    updated_at
    `
        )
        .eq("application_id", application.id)
        .order("issue_date", { ascending: false })
        .limit(1);

      // Get the first (most recent) QR code
      const qrCode = qrCodes && qrCodes.length > 0 ? qrCodes[0] : null;

      if (!qrError && qrCode) {
        // Parse QR code data if it's a string
        const parsedQrData =
          typeof qrCode.qr_code_data === "string"
            ? JSON.parse(qrCode.qr_code_data)
            : qrCode.qr_code_data;

        qrCodeData = {
          licenseNumber: qrCode.license_number,
          qrCodeImage: qrCode.qr_code_image,
          issueDate:
            qrCode.issue_date || parsedQrData?.issued_date || qrCode.created_at,
          expiryDate: qrCode.expiry_date || parsedQrData?.expiry_date,
          createdAt: qrCode.created_at,
          updatedAt: qrCode.updated_at,
          qrData: {
            holderName: parsedQrData?.holder_name,
            nationalId: parsedQrData?.national_id,
            licenseType: parsedQrData?.license_type,
            issueDate:
              qrCode.issue_date ||
              parsedQrData?.issued_date ||
              qrCode.created_at,
            expiryDate: qrCode.expiry_date || parsedQrData?.expiry_date,
          },
        };
      }
    }

    // Transform the data to match the expected format
    const transformedApplication = {
      id: application.id,
      citizenId: application.citizen_id,
      licenseType: application.license_type,
      status: application.status,
      personalInfo: application.personal_info,
      documents: application.documents || {},
      emergencyContact: application.emergency_contact,
      photos: application.photos || {},
      reviewNotes: application.review_notes,
      submittedAt: application.submitted_at,
      approvedAt: application.approved_at,
      rejectedAt: application.rejected_at,
      createdAt: application.created_at,
      pickedUp: application.picked_up,
      pickupTime: application.pickup_time,
      updatedAt: application.updated_at,
      qrCode: qrCodeData,
    };

    return NextResponse.json({
      success: true,
      data: transformedApplication,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
