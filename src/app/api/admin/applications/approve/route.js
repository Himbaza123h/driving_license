import { supabaseAdmin } from "../../../../../../backend/config/database";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { applicationId, action, reviewNotes, adminId } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Application ID and action are required' 
        }, 
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action. Must be "APPROVED" or "REJECTED"' 
        }, 
        { status: 400 }
      );
    }

    // First, check if application exists and is in a valid state
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('license_applications')
      .select('id, status')
      .eq('id', applicationId)
      .single();

    if (fetchError || !existingApp) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Application not found' 
        }, 
        { status: 404 }
      );
    }

    // Check if application is already processed
    if (existingApp.status === 'APPROVED' || existingApp.status === 'REJECTED') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Application already ${existingApp.status}` 
        }, 
        { status: 400 }
      );
    }

    // Prepare update data - use uppercase values to match database constraint
    const updateData = {
      status: action, // Keep as 'APPROVED' or 'REJECTED' (uppercase)
      review_notes: reviewNotes || null,
      updated_at: new Date().toISOString()
    };

    // Set approval/rejection timestamp
    if (action === 'APPROVED') {
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.rejected_at = new Date().toISOString();
    }

    // Update the application
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from('license_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update application status' 
        }, 
        { status: 500 }
      );
    }

    // Log the admin action (optional - you can create an audit log table)
    try {
      await supabaseAdmin
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          action_type: action,
          application_id: applicationId,
          notes: reviewNotes,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Don't fail the main operation if logging fails
    }

    // Transform response data
    const transformedApplication = {
      id: updatedApp.id,
      citizenId: updatedApp.citizen_id,
      licenseType: updatedApp.license_type,
      status: updatedApp.status,
      submittedAt: updatedApp.submitted_at,
      approvedAt: updatedApp.approved_at,
      rejectedAt: updatedApp.rejected_at,
      reviewNotes: updatedApp.review_notes,
      createdAt: updatedApp.created_at,
      updatedAt: updatedApp.updated_at
    };

    return NextResponse.json({
      success: true,
      message: `Application ${action}d successfully`,
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

// Batch approve/reject multiple applications
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { applicationIds, action, reviewNotes, adminId } = body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Application IDs array is required' 
        }, 
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action. Must be "APPROVED" or "REJECTED"' 
        }, 
        { status: 400 }
      );
    }

    // Prepare update data - use uppercase values to match database constraint
    const updateData = {
      status: action, // Keep as 'APPROVED' or 'REJECTED' (uppercase)
      review_notes: reviewNotes || null,
      updated_at: new Date().toISOString()
    };

    // Set approval/rejection timestamp
    if (action === 'APPROVED') {
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.rejected_at = new Date().toISOString();
    }

    // Update all applications - use uppercase values for filtering
    const { data: updatedApps, error: updateError } = await supabaseAdmin
      .from('license_applications')
      .update(updateData)
      .in('id', applicationIds)
      .in('status', ['DRAFT', 'PENDING', 'UNDER_REVIEW']) // Use uppercase values
      .select();

    if (updateError) {
      console.error('Database batch update error:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update application statuses' 
        }, 
        { status: 500 }
      );
    }

    // Log admin actions for each application
    try {
      const adminActions = updatedApps.map(app => ({
        admin_id: adminId,
        action_type: action,
        application_id: app.id,
        notes: reviewNotes,
        created_at: new Date().toISOString()
      }));

      await supabaseAdmin
        .from('admin_actions')
        .insert(adminActions);
    } catch (logError) {
      console.error('Failed to log admin actions:', logError);
      // Don't fail the main operation if logging fails
    }

    // Transform response data
    const transformedApplications = updatedApps.map(app => ({
      id: app.id,
      citizenId: app.citizen_id,
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
      message: `${updatedApps.length} applications ${action}d successfully`,
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