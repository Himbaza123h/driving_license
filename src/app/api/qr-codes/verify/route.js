import { supabaseAdmin } from "../../../../../backend/config/database";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR data is required' },
        { status: 400 }
      );
    }

    let parsedData;
    try {
      // Parse QR data if it's a string
      parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (parseError) {
      return NextResponse.json(
        { 
          valid: false,
          status: 'invalid',
          message: 'Invalid QR code format'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!parsedData.licenseNumber || !parsedData.applicationId) {
      return NextResponse.json(
        { 
          valid: false,
          status: 'invalid',
          message: 'Invalid QR code data'
        },
        { status: 400 }
      );
    }

    // Fetch QR code from database
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('qr_codes')
      .select(`
        *,
        license_applications (
          id,
          status,
          personal_info,
          license_type
        )
      `)
      .eq('license_number', parsedData.licenseNumber)
      .eq('application_id', parsedData.applicationId)
      .single();

    if (qrError || !qrCode) {
      return NextResponse.json({
        valid: false,
        status: 'invalid',
        message: 'License not found in database'
      });
    }

    // Check if license is expired
    const now = new Date();
    const expiryDate = new Date(qrCode.expiry_date);
    
    if (now > expiryDate) {
      // Update status to expired if not already
      if (qrCode.status !== 'expired') {
        await supabaseAdmin
          .from('qr_codes')
          .update({ status: 'expired' })
          .eq('id', qrCode.id);
      }

      return NextResponse.json({
        valid: false,
        status: 'expired',
        message: 'License has expired',
        data: {
          licenseNumber: qrCode.license_number,
          holderName: parsedData.holderName,
          licenseType: qrCode.license_applications?.license_type,
          issueDate: qrCode.issue_date,
          expiryDate: qrCode.expiry_date
        }
      });
    }

    // Check current status
    if (qrCode.status === 'invalid') {
      return NextResponse.json({
        valid: false,
        status: 'invalid',
        message: 'License has been invalidated',
        data: {
          licenseNumber: qrCode.license_number,
          holderName: parsedData.holderName,
          licenseType: qrCode.license_applications?.license_type,
          issueDate: qrCode.issue_date,
          expiryDate: qrCode.expiry_date
        }
      });
    }

    // License is valid
    return NextResponse.json({
      valid: true,
      status: 'valid',
      message: 'Valid license',
      data: {
        licenseNumber: qrCode.license_number,
        holderName: parsedData.holderName,
        licenseType: qrCode.license_applications?.license_type,
        nationalId: parsedData.nationalId,
        issueDate: qrCode.issue_date,
        expiryDate: qrCode.expiry_date,
        applicationStatus: qrCode.license_applications?.status
      }
    });

  } catch (error) {
    console.error('Error verifying QR code:', error);
    return NextResponse.json(
      { 
        valid: false,
        status: 'invalid',
        message: 'Error verifying license'
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseNumber = searchParams.get('licenseNumber');

    if (!licenseNumber) {
      return NextResponse.json(
        { error: 'License number is required' },
        { status: 400 }
      );
    }

    // Fetch QR code by license number
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('qr_codes')
      .select(`
        *,
        license_applications (
          id,
          status,
          personal_info,
          license_type
        )
      `)
      .eq('license_number', licenseNumber)
      .single();

    if (qrError || !qrCode) {
      return NextResponse.json({
        valid: false,
        status: 'invalid',
        message: 'License not found'
      });
    }

    // Check if license is expired
    const now = new Date();
    const expiryDate = new Date(qrCode.expiry_date);
    
    if (now > expiryDate) {
      return NextResponse.json({
        valid: false,
        status: 'expired',
        message: 'License has expired',
        data: {
          licenseNumber: qrCode.license_number,
          licenseType: qrCode.license_applications?.license_type,
          issueDate: qrCode.issue_date,
          expiryDate: qrCode.expiry_date
        }
      });
    }

    // Check current status
    if (qrCode.status === 'invalid') {
      return NextResponse.json({
        valid: false,
        status: 'invalid',
        message: 'License has been invalidated'
      });
    }

    // Parse QR data for holder name
    let holderName = 'Unknown';
    try {
      const qrData = JSON.parse(qrCode.qr_code_data);
      holderName = qrData.holderName || 'Unknown';
    } catch (e) {
      console.error('Error parsing QR data:', e);
    }

    return NextResponse.json({
      valid: true,
      status: 'valid',
      message: 'Valid license',
      data: {
        licenseNumber: qrCode.license_number,
        holderName,
        licenseType: qrCode.license_applications?.license_type,
        issueDate: qrCode.issue_date,
        expiryDate: qrCode.expiry_date
      }
    });

  } catch (error) {
    console.error('Error fetching license:', error);
    return NextResponse.json(
      { 
        valid: false,
        status: 'invalid',
        message: 'Error fetching license'
      },
      { status: 500 }
    );
  }
}