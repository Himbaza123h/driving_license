import { supabaseAdmin } from "../../../../../backend/config/database";
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseNumber = searchParams.get('license');
    
    if (!licenseNumber) {
      return NextResponse.json({
        error: 'License number is required',
        success: false
      }, { status: 400 });
    }
    
    console.log('🔍 Verifying license:', licenseNumber);
    
    // Find the QR code record
    const { data: qrCodeRecord, error: qrError } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('license_number', licenseNumber)
      .single();
    
    if (qrError || !qrCodeRecord) {
      console.error('❌ QR code not found:', licenseNumber);
      return NextResponse.json({
        error: 'License not found',
        success: false,
        valid: false
      }, { status: 404 });
    }
    
    // Get the associated application
    const { data: applicationRecord, error: appError } = await supabaseAdmin
      .from('license_applications')
      .select('*')
      .eq('id', qrCodeRecord.application_id)
      .single();
    
    if (appError || !applicationRecord) {
      console.error('❌ Application not found for QR code:', licenseNumber);
      return NextResponse.json({
        error: 'Application not found',
        success: false,
        valid: false
      }, { status: 404 });
    }
    
    // Parse QR code data
    const qrData = typeof qrCodeRecord.qr_code_data === 'string' 
      ? JSON.parse(qrCodeRecord.qr_code_data) 
      : qrCodeRecord.qr_code_data;
    
    // Check if license is expired
    const currentDate = new Date();
    const expiryDate = new Date(qrData.expiry_date);
    const isExpired = currentDate > expiryDate;
    
    // Check if license is valid (not expired and application is approved)
    const isValid = !isExpired && (applicationRecord.status === 'approved' || applicationRecord.status === 'completed');
    
    console.log('✅ License verification completed:', {
      licenseNumber,
      isValid,
      isExpired,
      status: applicationRecord.status
    });
    
    return NextResponse.json({
      success: true,
      valid: isValid,
      expired: isExpired,
      license: {
        license_number: qrCodeRecord.license_number,
        holder_name: qrData.holder_name,
        national_id: qrData.national_id,
        license_type: qrData.license_type,
        issue_date: qrData.issued_date,
        expiry_date: qrData.expiry_date,
        status: applicationRecord.status,
        created_at: qrCodeRecord.created_at
      },
      message: isValid ? 'License is valid' : (isExpired ? 'License has expired' : 'License is not valid')
    });
    
  } catch (error) {
    console.error('❌ Fatal error verifying license:', error);
    return NextResponse.json({
      error: 'Internal server error',
      success: false,
      valid: false,
      details: error.message
    }, { status: 500 });
  }
}

// POST method for verifying with QR code content
export async function POST(request) {
  try {
    const body = await request.json();
    const { qrContent } = body;
    
    if (!qrContent) {
      return NextResponse.json({
        error: 'QR code content is required',
        success: false
      }, { status: 400 });
    }
    
    console.log('🔍 Verifying QR code content');
    
    // Parse QR code content
    let qrData;
    try {
      qrData = typeof qrContent === 'string' ? JSON.parse(qrContent) : qrContent;
    } catch (parseError) {
      console.error('❌ Invalid QR code format:', parseError);
      return NextResponse.json({
        error: 'Invalid QR code format',
        success: false,
        valid: false
      }, { status: 400 });
    }
    
    const { licenseNumber } = qrData;
    
    if (!licenseNumber) {
      return NextResponse.json({
        error: 'License number not found in QR code',
        success: false,
        valid: false
      }, { status: 400 });
    }
    
    // Use the GET logic to verify the license
    // const { searchParams } = new URL(request.url);
    const verifyUrl = new URL(request.url);
    verifyUrl.searchParams.set('license', licenseNumber);
    
    // Call the GET method logic
    return await this.GET({ url: verifyUrl.toString() });
    
  } catch (error) {
    console.error('❌ Fatal error verifying QR code:', error);
    return NextResponse.json({
      error: 'Internal server error',
      success: false,
      valid: false,
      details: error.message
    }, { status: 500 });
  }
}