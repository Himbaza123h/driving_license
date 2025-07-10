import { supabaseAdmin } from '../../../../../backend/config/database'
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const nationalId = formData.get('nationalId')
    const licenseType = formData.get('licenseType')
    
    console.log('Received documents upload for:', { nationalId, licenseType })

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
    const savedDocuments = {}
    const documentTypes = ['nationalId', 'medicalCertificate', 'drivingSchoolCertificate', 'passportPhoto', 'additionalDocuments']

    for (const docType of documentTypes) {
      const file = formData.get(docType)
      if (file && file instanceof File) {
        try {
          // Create directory path
          const uploadDir = path.join(process.cwd(), 'public', 'documents', docType)
          await mkdir(uploadDir, { recursive: true })

          // Generate unique filename
          const timestamp = Date.now()
          const fileExtension = path.extname(file.name)
          const fileName = `${citizen.id}_${timestamp}${fileExtension}`
          const filePath = path.join(uploadDir, fileName)

          // Save file
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)

          // Store relative path for database
          savedDocuments[docType] = {
            fileName: file.name,
            filePath: `/documents/${docType}/${fileName}`,
            fileSize: file.size,
            uploadedAt: new Date().toISOString()
          }

          console.log(`Saved ${docType}: ${fileName}`)
        } catch (error) {
          console.error(`Error saving ${docType}:`, error)
          return NextResponse.json(
            { error: `Failed to save ${docType}` },
            { status: 500 }
          )
        }
      }
    }

    // Update application with documents
    const {  error: updateError } = await supabaseAdmin
      .from('license_applications')
      .update({
        documents: savedDocuments,
        updated_at: new Date().toISOString()
      })
      .eq('id', application.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application with documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: savedDocuments,
      applicationId: application.id
    })

  } catch (error) {
    console.error('Error in documents API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}