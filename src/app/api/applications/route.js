import { supabaseAdmin } from "../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const citizenId = searchParams.get('citizenId')

    // Validate required parameters
    if (!citizenId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: citizenId' },
        { status: 400 }
      )
    }

    // Get all applications for the citizen
    const { data, error } = await supabaseAdmin
      .from('license_applications')
      .select(`
        id,
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
        updated_at,
        photos
      `)
      .eq('citizen_id', citizenId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // Format the applications data
    const formattedApplications = data.map(app => ({
      id: app.id,
      licenseType: app.license_type,
      status: app.status,
      personalInfo: app.personal_info,
      documents: app.documents,
      emergencyContact: app.emergency_contact,
      reviewNotes: app.review_notes,
      submittedAt: app.submitted_at,
      approvedAt: app.approved_at,
      rejectedAt: app.rejected_at,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      photos: app.photos
    }))

    return NextResponse.json({
      success: true,
      data: formattedApplications,
      count: formattedApplications.length
    })

  } catch (error) {
    console.error('Error in get applications API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}