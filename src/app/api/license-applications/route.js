import { supabaseAdmin } from "../../../../backend/config/database"
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { 
      licenseType, 
      personalInfo, 
      documents, 
      emergencyContact, 
      photo 
    } = await request.json();

    // Log the incoming request data
    console.log('=== INCOMING REQUEST DATA ===');
    console.log('License Type:', licenseType);
    console.log('Personal Info:', JSON.stringify(personalInfo, null, 2));
    console.log('Documents:', JSON.stringify(documents, null, 2));
    console.log('Emergency Contact:', JSON.stringify(emergencyContact, null, 2));
    console.log('Photo:', JSON.stringify(photo, null, 2));

    // Get the user's national ID from the session/auth
    const userNationalId = personalInfo?.nationalId;
    
    console.log('=== NATIONAL ID EXTRACTION ===');
    console.log('Extracted National ID:', userNationalId);
    console.log('National ID type:', typeof userNationalId);
    console.log('National ID length:', userNationalId?.length);
    
    if (!userNationalId) {
      console.log('❌ National ID is missing or falsy');
      return NextResponse.json(
        { error: 'National ID is required' },
        { status: 400 }
      );
    }

    // Log the database query attempt
    console.log('=== DATABASE QUERY ATTEMPT ===');
    console.log('Querying citizens table with national_id:', userNationalId);
    
    // Find the citizen record by national_id
    const { data: citizen, error: citizenError } = await supabaseAdmin
      .from('citizens')
      .select('id, national_id, full_name')
      .eq('national_id', userNationalId)
      .single();

    // If not found, try with truncated national ID (first 13 digits)
    let citizenFallback = null;
    let citizenFallbackError = null;
    
    if (citizenError && userNationalId.length > 13) {
      const truncatedNationalId = userNationalId.substring(0, 13);
      console.log('=== TRYING TRUNCATED NATIONAL ID ===');
      console.log('Truncated to 13 digits:', truncatedNationalId);
      
      const { data: fallbackCitizen, error: fallbackError } = await supabaseAdmin
        .from('citizens')
        .select('id, national_id, full_name')
        .eq('national_id', truncatedNationalId)
        .single();
      
      citizenFallback = fallbackCitizen;
      citizenFallbackError = fallbackError;
      
      console.log('Truncated search result:', JSON.stringify(fallbackCitizen, null, 2));
      console.log('Truncated search error:', JSON.stringify(fallbackError, null, 2));
    }

    console.log('=== DATABASE QUERY RESULT ===');
    console.log('Citizen data:', JSON.stringify(citizen, null, 2));
    console.log('Citizen error:', JSON.stringify(citizenError, null, 2));
    
    // Use fallback result if main search failed but fallback succeeded
    const finalCitizen = citizen || citizenFallback;
    const finalCitizenError = citizen ? citizenError : citizenFallbackError;

    // Let's also check if there are any citizens at all and what the national_id format looks like
    const { data: allCitizens, error: allCitizensError } = await supabaseAdmin
      .from('citizens')
      .select('id, national_id, full_name')
      .limit(10); // Updated to show 10 records

    console.log('=== SAMPLE CITIZENS DATA ===');
    console.log('Sample citizens:', JSON.stringify(allCitizens, null, 2));
    console.log('Sample citizens error:', JSON.stringify(allCitizensError, null, 2));

    // Log detailed info about each citizen's national_id
    console.log('=== NATIONAL ID ANALYSIS ===');
    allCitizens?.forEach((citizen, index) => {
      console.log(`Citizen ${index + 1}: ID="${citizen.national_id}", Length=${citizen.national_id.length}, Name="${citizen.full_name}"`);
    });

    // Try a case-insensitive search as backup
    const { data: citizenCaseInsensitive, error: citizenCaseInsensitiveError } = await supabaseAdmin
      .from('citizens')
      .select('id, national_id, full_name')
      .ilike('national_id', userNationalId);

    console.log('=== CASE-INSENSITIVE SEARCH ===');
    console.log('Case-insensitive result:', JSON.stringify(citizenCaseInsensitive, null, 2));
    console.log('Case-insensitive error:', JSON.stringify(citizenCaseInsensitiveError, null, 2));

    // Check if the national_id might have whitespace issues
    const trimmedNationalId = userNationalId.trim();
    console.log('=== TRIMMED NATIONAL ID CHECK ===');
    console.log('Original:', `"${userNationalId}"`);
    console.log('Trimmed:', `"${trimmedNationalId}"`);
    console.log('Are they different?', userNationalId !== trimmedNationalId);

    if (finalCitizenError || !finalCitizen) {
      console.error('❌ Citizen lookup failed');
      console.error('Error details:', finalCitizenError);
      console.error('Citizen data:', finalCitizen);
      
      return NextResponse.json(
        { 
          error: 'Citizen not found. Please ensure your national ID is registered in the system.',
          debug: {
            searchedNationalId: userNationalId,
            searchedNationalIdType: typeof userNationalId,
            searchedNationalIdLength: userNationalId?.length,
            trimmedNationalId: trimmedNationalId,
            truncatedNationalId: userNationalId.length > 13 ? userNationalId.substring(0, 13) : null,
            citizenError: citizenError,
            citizenFallbackError: citizenFallbackError,
            sampleCitizens: allCitizens?.slice(0, 10), // Now showing up to 10 for debugging
            caseInsensitiveResults: citizenCaseInsensitive?.length || 0
          }
        },
        { status: 404 }
      );
    }

    console.log('✅ Citizen found successfully');
    console.log('Citizen details:', { id: finalCitizen.id, national_id: finalCitizen.national_id, full_name: finalCitizen.full_name });

    // Generate application ID based on national ID with last 5 digits replaced
    const generateApplicationId = (nationalId) => {
      // Generate 5 random digits
      const randomDigits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      
      // Replace last 5 digits with random ones
      if (nationalId.length >= 5) {
        return nationalId.slice(0, -5) + randomDigits;
      } else {
        // If national ID is less than 5 digits, just append random digits
        return nationalId + randomDigits;
      }
    };
    
    const generatedApplicationId = generateApplicationId(userNationalId);
    
    console.log('=== APPLICATION ID GENERATION ===');
    console.log('Original National ID:', userNationalId);
    console.log('Generated Application ID:', generatedApplicationId);
    console.log('Application ID type:', typeof generatedApplicationId);
    console.log('Application ID length:', generatedApplicationId.length);
    
    // Map license type to database values
    const LICENSE_TYPE_MAPPING = {
      'car': 'CAR',
      'motorcycle': 'MOTORCYCLE',
      'commercial': 'COMMERCIAL',
      'cdl': 'CDL'
    };

    // Prepare application data
    const applicationData = {
      id: generatedApplicationId, // Using the generated ID
      citizen_id: finalCitizen.id, // Use the actual citizen ID from the database
      license_type: LICENSE_TYPE_MAPPING[licenseType] || licenseType.toUpperCase(),
      status: 'DRAFT',
      personal_info: personalInfo,
      documents: {
        identityDocument: documents?.nationalId || null,
        proofOfResidence: documents?.proofOfResidence || null,
        medicalCertificate: documents?.medicalCertificate || null,
        drivingSchoolCertificate: documents?.drivingSchoolCertificate || null,
        profilePhoto: photo?.profilePhoto || null,
        signature: photo?.signature || null
      },
      emergency_contact: emergencyContact || {
        name: "Emergency Contact",
        relationship: "Friend",
        phone: "+250700000000",
        email: "emergency@example.com"
      },
      review_notes: null,
      submitted_at: new Date().toISOString(),
      approved_at: null,
      rejected_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('=== APPLICATION DATA TO INSERT/UPDATE ===');
    console.log('Application data:', JSON.stringify(applicationData, null, 2));
    console.log('Application ID in data object:', applicationData.id);

    // Check if there's already an application for this citizen
    console.log('=== CHECKING FOR EXISTING APPLICATION ===');
    const { data: existingApplication, error: existingError } = await supabaseAdmin
      .from('license_applications')
      .select('id, citizen_id, status, created_at')
      .eq('citizen_id', finalCitizen.id)
      .single();

    console.log('Existing application check result:', JSON.stringify(existingApplication, null, 2));
    console.log('Existing application error:', JSON.stringify(existingError, null, 2));

    let data, error;

    if (existingApplication && !existingError) {
      // Update existing application
      console.log('=== UPDATING EXISTING APPLICATION ===');
      console.log('Updating application with ID:', existingApplication.id);
      
      // Remove id from applicationData since we're updating
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, ...updateData } = applicationData;
      updateData.updated_at = new Date().toISOString();
      
      console.log('Update data:', JSON.stringify(updateData, null, 2));
      
      const updateResult = await supabaseAdmin
        .from('license_applications')
        .update(updateData)
        .eq('id', existingApplication.id)
        .select();
      
      data = updateResult.data;
      error = updateResult.error;
      
      console.log('=== UPDATE RESULT ===');
      console.log('Update data:', JSON.stringify(data, null, 2));
      console.log('Update error:', JSON.stringify(error, null, 2));
      
    } else {
      // Insert new application
      console.log('=== INSERTING NEW APPLICATION ===');
      
      const insertResult = await supabaseAdmin
        .from('license_applications')
        .insert([applicationData])
        .select();
      
      data = insertResult.data;
      error = insertResult.error;
      
      console.log('=== INSERT RESULT ===');
      console.log('Insert data:', JSON.stringify(data, null, 2));
      console.log('Insert error:', JSON.stringify(error, null, 2));
    }

    if (error) {
      console.error('❌ Database operation error:', error);
      return NextResponse.json(
        { error: 'Failed to save application', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Application saved successfully');
    
    // Debug: Compare generated ID vs saved ID
    console.log('=== ID COMPARISON ===');
    console.log('Generated ID:', generatedApplicationId);
    console.log('Saved record ID:', data[0]?.id);
    console.log('IDs match:', generatedApplicationId === data[0]?.id);
    console.log('Saved record details:', JSON.stringify(data[0], null, 2));
    console.log('Operation type:', existingApplication ? 'UPDATE' : 'INSERT');
    
    return NextResponse.json({
      success: true,
      data: {
        applicationId: data[0].id,
        status: data[0].status,
        createdAt: data[0].created_at,
        citizenName: finalCitizen.full_name,
        operationType: existingApplication ? 'updated' : 'created'
      },
      debug: {
        generatedId: generatedApplicationId,
        savedId: data[0]?.id,
        idsMatch: generatedApplicationId === data[0]?.id,
        operationType: existingApplication ? 'UPDATE' : 'INSERT',
        existingApplicationId: existingApplication?.id || null
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}