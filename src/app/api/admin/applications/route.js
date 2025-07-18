import { supabaseAdmin } from "../../../../../backend/config/database";
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query based on filters
    let query = supabaseAdmin
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
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: applications, error } = await query;

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

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('license_applications')
      .select('*', { count: 'exact', head: true });

    // Transform the data to match the expected format
    const transformedApplications = applications.map(app => ({
      id: app.id,
      citizenId: app.citizen_id,
      licenseType: app.license_type,
      status: app.status,
      submittedAt: app.submitted_at,
      approvedAt: app.approved_at,
      rejectedAt: app.rejected_at,
      reviewNotes: app.review_notes,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      personalInfo: app.personal_info
    }));

    return NextResponse.json({
      success: true,
      data: transformedApplications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
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

// GET single application by ID
export async function POST(request) {
  try {
    const body = await request.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Application ID is required' 
        }, 
        { status: 400 }
      );
    }

    const { data: application, error } = await supabaseAdmin
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
        personal_info,
        documents
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch application from database' 
        }, 
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Application not found' 
        }, 
        { status: 404 }
      );
    }

    // Transform the data
    const transformedApplication = {
      id: application.id,
      citizenId: application.citizen_id,
      licenseType: application.license_type,
      status: application.status,
      submittedAt: application.submitted_at,
      approvedAt: application.approved_at,
      rejectedAt: application.rejected_at,
      reviewNotes: application.review_notes,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
      personalInfo: application.personal_info,
      documents: application.documents
    };

    return NextResponse.json({
      success: true,
      data: transformedApplication
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