import { supabaseAdmin } from '../../../../../backend/config/database'
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { LICENSE_STATUS } from "@/utils/statusHelper";

export async function POST(request) {
  try {
    const formData = await request.formData()
    const nationalId = formData.get('nationalId')
    const licenseType = formData.get('licenseType')
    
    console.log('Received photo upload for:', { nationalId, licenseType })

    // Validate required fields
    if (!nationalId || !licenseType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find citizen by national ID (with fallback logic)
    let { data: citizen, error: citizenError } = await supabaseAdmin
      .from('citizens')
      .select('id, national_id, full_name')
      .eq('national_id', nationalId)
      .single()

    // Fallback for truncated national ID
    if (citizenError && nationalId.length > 13) {
      const truncatedNationalId = nationalId.substring(0, 13);
      const { data: fallbackCitizen, error: fallbackError } = await supabaseAdmin
        .from('citizens')
        .select('id, national_id, full_name')
        .eq('national_id', truncatedNationalId)
        .single();

      if (!fallbackError && fallbackCitizen) {
        citizen = fallbackCitizen;
        citizenError = null;
      }
    }

    if (citizenError || !citizen) {
      return NextResponse.json(
        { error: 'User not found with this national ID' },
        { status: 404 }
      )
    }

    // Find existing application
    const { data: application, error: appError } = await supabaseAdmin
      .from('license_applications')
      .select('*')
      .eq('citizen_id', citizen.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found. Please complete personal information first.' },
        { status: 404 }
      )
    }

    // Process uploaded files
    const savedPhotos = {}
    const photoTypes = ['profilePhoto', 'signature']

    for (const photoType of photoTypes) {
      const file = formData.get(photoType)
      if (file && file instanceof File) {
        try {
          // Create directory path
          const uploadDir = path.join(process.cwd(), 'public', 'photos', photoType)
          await mkdir(uploadDir, { recursive: true })

          // Generate unique filename
          const timestamp = Date.now()
          const fileExtension = photoType === 'signature' ? '.png' : '.jpg'
          const fileName = `${citizen.id}_${timestamp}${fileExtension}`
          const filePath = path.join(uploadDir, fileName)

          // Save file
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)

          // Store relative path for database
          savedPhotos[photoType] = {
            fileName: file.name || `${photoType}${fileExtension}`,
            filePath: `/photos/${photoType}/${fileName}`,
            fileSize: file.size,
            uploadedAt: new Date().toISOString()
          }

          console.log(`Saved ${photoType}: ${fileName}`)
        } catch (error) {
          console.error(`Error saving ${photoType}:`, error)
          return NextResponse.json(
            { error: `Failed to save ${photoType}` },
            { status: 500 }
          )
        }
      }
    }

    // Update application with photos and set status to submitted
    const updateData = {
      photos: savedPhotos,
      status: LICENSE_STATUS.PENDING,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('license_applications')
      .update(updateData)
      .eq('id', application.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application with photos' },
        { status: 500 }
      )
    }

    console.log('Application updated successfully with photos and status:', updatedApplication)

    return NextResponse.json({
      success: true,
      message: 'Photos uploaded successfully and application submitted',
      photos: savedPhotos,
      applicationId: application.id,
      status: 'submitted',
      data: {
        applicationId: application.id,
        nationalId: citizen.national_id
      }
    })

  } catch (error) {
    console.error('Error in photos API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}