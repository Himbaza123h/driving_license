import { supabaseAdmin } from "../../../../backend/config/database";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { citizenId } = body;

    if (!citizenId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Citizen ID is required' 
        }, 
        { status: 400 }
      );
    }

    // Fetch applications from the database by searching in personal_info JSON column
    const { data: applications, error } = await supabaseAdmin
      .from('license_applications')
      .select(`
        id,
        citizen_id,
        license_type,
        status,
        review_notes,
        submitted_at,
        approved_at,
        rejected_at,
        created_at,
        updated_at,
        personal_info
      `)
      .eq('personal_info->>nationalId', citizenId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch applications from database' 
        }, 
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedApplications = applications.map(app => ({
      id: app.id,
      licenseType: app.license_type,
      status: app.status,
      submittedAt: app.submitted_at,
      approvedAt: app.approved_at,
      rejectedAt: app.rejected_at,
      reviewNotes: app.review_notes,
      createdAt: app.created_at,
      updatedAt: app.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: transformedApplications
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}