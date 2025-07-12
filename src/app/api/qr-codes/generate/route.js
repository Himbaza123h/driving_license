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
    
    // First, check if QR code already exists for this application
    const { data: existingQRCode, error: qrFetchError } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle();
    
    if (qrFetchError) {
      console.error('❌ Error checking existing QR code:', qrFetchError);
    }
    
    // If QR code already exists, return it
    if (existingQRCode) {
      console.log('✅ Found existing QR code for application:', applicationId);
      
      // Parse the QR code data
      const qrData = typeof existingQRCode.qr_code_data === 'string' 
        ? JSON.parse(existingQRCode.qr_code_data) 
        : existingQRCode.qr_code_data;
      
      return NextResponse.json({
        success: true,
        data: {
          license_number: existingQRCode.license_number,
          qr_code_image: existingQRCode.qr_code_image,
          issue_date: qrData.issued_date || existingQRCode.created_at,
          expiry_date: qrData.expiry_date,
          created_at: existingQRCode.created_at,
          qr_data: {
            holderName: qrData.holder_name,
            nationalId: qrData.national_id,
            licenseType: qrData.license_type,
            issueDate: qrData.issued_date || existingQRCode.created_at,
            expiryDate: qrData.expiry_date
          }
        },
        message: 'Existing QR code retrieved successfully'
      });
    }
    
    // Fetch the existing application to get all data
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
    
    // Save QR code to qr_codes table
    const { data: savedQRCode, error: saveError } = await supabaseAdmin
      .from('qr_codes')
      .insert({
        application_id: existingApplication.id,
        license_number: licenseNumber,
        qr_code_data: qrCodeData,
        qr_code_image: qrCodeImage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('❌ Error saving QR code to database:', saveError);
      return NextResponse.json({
        error: 'Failed to save QR code to database',
        success: false,
        details: saveError.message || saveError
      }, { status: 500 });
    }
    
    // Update the application with license number if it didn't have one
    if (!existingApplication.license_number) {
      const { error: updateError } = await supabaseAdmin
        .from('license_applications')
        .update({
          license_number: licenseNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingApplication.id);
      
      if (updateError) {
        console.error('❌ Error updating application with license number:', updateError);
        // Don't return error here as QR code was saved successfully
      }
    }
    
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
    
    if (updateError) {
      console.error('❌ Error updating application:', updateError);
      return NextResponse.json({
        error: 'Failed to update application',
        success: false,
        details: updateError
      }, { status: 500 });
    }
    
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