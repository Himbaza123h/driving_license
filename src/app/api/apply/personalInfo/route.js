import { supabaseAdmin } from "../../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { 
      licenseType,
      personalInfo,
      nationalId
    } = await request.json()

    console.log('Received data:', { licenseType, personalInfo, nationalId })

    // Validate required fields
    if (!personalInfo || !nationalId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find user by national ID
    const { data: citizen, error: citizenError } = await supabaseAdmin
      .from('citizens')
      .select('id, national_id, full_name')
      .eq('national_id', nationalId)
      .single()

    let finalCitizen = citizen;
    let finalCitizenError = citizenError;

    // Fallback approach if citizen not found and national ID is longer than 13 digits
    if (citizenError && nationalId.length > 13) {
      const truncatedNationalId = nationalId.substring(0, 13);
      console.log('=== TRYING TRUNCATED NATIONAL ID ===');
      console.log('Original National ID:', nationalId);
      console.log('Truncated to 13 digits:', truncatedNationalId);
     
      const { data: fallbackCitizen, error: fallbackError } = await supabaseAdmin
        .from('citizens')
        .select('id, national_id, full_name')
        .eq('national_id', truncatedNationalId)
        .single();

      if (!fallbackError && fallbackCitizen) {
        console.log('Found citizen with truncated ID:', fallbackCitizen);
        finalCitizen = fallbackCitizen;
        finalCitizenError = null;
      } else {
        console.log('Fallback also failed:', fallbackError);
        finalCitizenError = fallbackError;
      }
    }

    if (finalCitizenError || !finalCitizen) {
      console.log('No citizen found with national ID:', nationalId);
      return NextResponse.json(
        { error: 'User not found with this national ID' },
        { status: 404 }
      )
    }

    const userId = finalCitizen.id
    console.log('Found citizen:', finalCitizen);

    // Check if application already exists for this citizen
    const { data: existingApplication } = await supabaseAdmin
      .from('license_applications')
      .select('*')
      .eq('citizen_id', userId)
      .single()

    let applicationId
    let result

    if (existingApplication) {
      // Update existing application
      applicationId = existingApplication.id
      
      const { data: updatedApplication, error: updateError } = await supabaseAdmin
        .from('license_applications')
        .update({
          license_type: licenseType,
          personal_info: personalInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating application:', updateError)
        return NextResponse.json(
          { error: 'Failed to update application' },
          { status: 500 }
        )
      }

      result = updatedApplication
      console.log('Updated existing application:', applicationId)
    } else {
      // Create new application
      // Generate unique application ID
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substr(2, 5)
      applicationId = `LIC-${timestamp}-${random}`.toUpperCase()

      const { data: newApplication, error: insertError } = await supabaseAdmin
        .from('license_applications')
        .insert({
          id: applicationId,
          citizen_id: userId,
          license_type: licenseType,
          status: 'DRAFT',
          personal_info: personalInfo,
          documents: {},
          emergency_contact: personalInfo.emergencyContact || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating application:', insertError)
        return NextResponse.json(
          { error: 'Failed to create application' },
          { status: 500 }
        )
      }

      result = newApplication
      console.log('Created new application:', applicationId)
    }

    return NextResponse.json({
      success: true,
      applicationId: applicationId,
      message: existingApplication ? 'Application updated successfully' : 'Application created successfully',
      data: result
    })

  } catch (error) {
    console.error('Error in personal info API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}