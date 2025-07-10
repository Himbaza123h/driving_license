import { supabaseAdmin } from "../../../../../backend/config/database";
import { NextResponse } from 'next/server';
import { LICENSE_STATUS } from "@/utils/statusHelper";
import QRCode from 'qrcode';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');
    
    if (!applicationId) {
      return NextResponse.json({
        error: 'Application ID is required',
        success: false
      }, { status: 400 });
    }
    
    console.log('🔍 Fetching application with ID:', applicationId);
    
    // Fetch the specific application from database
    const { data: applicationRecord, error: fetchError } = await supabaseAdmin
      .from('license_applications')
      .select('*')
      .eq('id', applicationId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching application:', fetchError);
      return NextResponse.json({
        error: 'Application not found',
        success: false,
        details: fetchError
      }, { status: 404 });
    }
    
    if (!applicationRecord) {
      console.log('❌ No application found with ID:', applicationId);
      return NextResponse.json({
        error: 'Application not found',
        success: false
      }, { status: 404 });
    }
    
    console.log('✅ Application found:', applicationRecord.id);
    
    // Return the application data
    return NextResponse.json({
      success: true,
      application: applicationRecord,
      message: 'Application fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Fatal error fetching application:', error);
    return NextResponse.json({
      error: 'Internal server error',
      success: false,
      details: error.message
    }, { status: 500 });
  }
}

// Generate QR code for existing application
export async function POST(request) {
  try {
    const body = await request.json();
    const { applicationId, personalInfo} = body;

    const nationalId = personalInfo?.nationalId;

    console.log('This is national id info', nationalId)
    
    if (!applicationId) {
      return NextResponse.json({
        error: 'Application ID is required',
        success: false
      }, { status: 400 });
    }
    
    console.log('🔍 Generating QR code for application:', applicationId);
    
    // First, fetch the existing application to get all data
    // const { data: existingApplication, error: fetchError } = await supabaseAdmin
    //   .from('license_applications')
    //   .select('*')
    //   .eq('id', applicationId)
    //   .single();


    const { data: existingApplication, error: fetchError } = await supabaseAdmin
      .from('license_applications')
      .select('*')
      .eq('personal_info->>nationalId', nationalId)
      .maybeSingle();
    
    if (fetchError || !existingApplication) {
      console.error('❌ Application not found:', applicationId);
      return NextResponse.json({
        error: 'Application not found',
        success: false
      }, { status: 404 });
    }
    
    console.log('✅ Found existing application:', existingApplication.id);
    
    // Generate license number - use existing license_number if available, otherwise create new one
    const licenseNumber = existingApplication.license_number || 
      `${existingApplication.license_type?.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Prepare QR code data using existing application data
    const qrCodeData = {
      license_number: licenseNumber,
      application_id: existingApplication.id,
      license_type: existingApplication.license_type,
      holder_name: `${existingApplication.personal_info?.firstName || ''} ${existingApplication.personal_info?.lastName || ''}`.trim(),
      national_id: existingApplication.personal_info?.nationalId || '',
      issued_date: new Date().toISOString().split('T')[0],
      expiry_date: calculateExpiryDate(existingApplication.license_type),
      status: existingApplication.status || LICENSE_STATUS.PENDING,
      qr_generated_at: new Date().toISOString()
    };
    
    console.log('📋 QR code data prepared:', qrCodeData);
    
    // Generate QR code image as base64 data URL
    let qrCodeImage = '';
    try {
      // Create QR code content with license verification URL
      const qrCodeContent = JSON.stringify({
        licenseNumber: licenseNumber,
        nationalId: qrCodeData.national_id,
        holderName: qrCodeData.holder_name,
        licenseType: qrCodeData.license_type,
        issuedDate: qrCodeData.issued_date,
        expiryDate: qrCodeData.expiry_date,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${licenseNumber}`
      });
      
      // Generate QR code as data URL
      qrCodeImage = await QRCode.toDataURL(qrCodeContent, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('✅ QR code image generated successfully');
    } catch (qrError) {
      console.error('❌ Error generating QR code image:', qrError);
      return NextResponse.json({
        error: 'Failed to generate QR code image',
        success: false,
        details: qrError.message
      }, { status: 500 });
    }
    

    
    // if (updateError) {
    //   console.error('❌ Error updating application with QR data:', updateError);
    //   return NextResponse.json({
    //     error: 'Failed to update application with QR code',
    //     success: false,
    //     details: updateError.message || updateError
    //   }, { status: 500 });
    // }
    
    console.log('✅ QR code generated and saved successfully');
    
    // Return the response with QR code data
    return NextResponse.json({
      success: true,
      data: {
        license_number: licenseNumber,
        qr_code_image: qrCodeImage,
        issue_date: qrCodeData.issued_date,
        expiry_date: qrCodeData.expiry_date,
        created_at: new Date().toISOString(),
        qr_data: {
          holderName: qrCodeData.holder_name,
          nationalId: qrCodeData.national_id,
          licenseType: qrCodeData.license_type,
          issueDate: qrCodeData.issued_date,
          expiryDate: qrCodeData.expiry_date
        }
      },
      message: 'QR code generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Fatal error generating QR code:', error);
    return NextResponse.json({
      error: 'Internal server error',
      success: false,
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to calculate expiry date based on license type
function calculateExpiryDate(licenseType) {
  const currentDate = new Date();
  let years = 5; // Default 5 years
  
  switch (licenseType) {
    case 'car':
      years = 5;
      break;
    case 'motorcycle':
      years = 5;
      break;
    case 'commercial':
      years = 3;
      break;
    default:
      years = 5;
  }
  
  currentDate.setFullYear(currentDate.getFullYear() + years);
  return currentDate.toISOString().split('T')[0];
}

// Update existing application
export async function PUT(request) {
  try {
    const body = await request.json();
    const { applicationId, updateData } = body;
    
    if (!applicationId) {
      return NextResponse.json({
        error: 'Application ID is required',
        success: false
      }, { status: 400 });
    }
    
    console.log('🔄 Updating application:', applicationId);
    
    // Update the application record
    const { data: updatedRecord, error: updateError } = await supabaseAdmin
      .from('license_applications')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();
    
    // if (updateError) {
    //   console.error('❌ Error updating application:', updateError);
    //   return NextResponse.json({
    //     error: 'Failed to update application',
    //     success: false,
    //     details: updateError
    //   }, { status: 500 });
    // }
    
    console.log('✅ Application updated successfully');
    
    return NextResponse.json({
      success: true,
      application: updatedRecord,
      message: 'Application updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Fatal error updating application:', error);
    return NextResponse.json({
      error: 'Internal server error',
      success: false,
      details: error.message
    }, { status: 500 });
  }
}