import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateLicenseApplication } from '../middleware/validation.js';

const router = express.Router();

// Create new license application
router.post('/', authenticateToken, validateLicenseApplication, async (req, res) => {
  try {
    const { 
      personalInfo, 
      documents, 
      emergencyContact,
      licenseType = 'STANDARD'
    } = req.body;

    // Check if citizen already has a pending or approved application
    const { data: existingApp, error: existingError } = await supabaseAdmin
      .from('license_applications')
      .select('id, status')
      .eq('citizen_id', req.citizenId)
      .in('status', ['PENDING', 'APPROVED', 'UNDER_REVIEW'])
      .single();

    if (existingApp && !existingError) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingApp.status.toLowerCase()} application`,
        error: 'EXISTING_APPLICATION',
        existingApplicationId: existingApp.id
      });
    }

    // Generate application ID
    const applicationId = `DLV${Date.now()}${uuidv4().substring(0, 4).toUpperCase()}`;

    // Create application record
    const applicationData = {
      id: applicationId,
      citizen_id: req.citizenId,
      license_type: licenseType,
      status: 'PENDING',
      personal_info: personalInfo,
      documents: documents,
      emergency_contact: emergencyContact,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: application, error: applicationError } = await supabaseAdmin
      .from('license_applications')
      .insert(applicationData)
      .select()
      .single();

    if (applicationError) {
      console.error('Application creation error:', applicationError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create application',
        error: 'APPLICATION_CREATION_FAILED'
      });
    }

    res.status(201).json({
      success: true,
      message: 'License application submitted successfully',
      applicationId: application.id,
      application: {
        id: application.id,
        status: application.status,
        licenseType: application.license_type,
        submittedAt: application.submitted_at,
        personalInfo: application.personal_info,
        documents: application.documents,
        emergencyContact: application.emergency_contact
      }
    });

  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: 'APPLICATION_SUBMISSION_FAILED'
    });
  }
});

// Get application by ID
router.get('/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const { data: application, error } = await supabaseAdmin
      .from('license_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('citizen_id', req.citizenId)
      .single();

    if (error || !application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: 'APPLICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        licenseType: application.license_type,
        submittedAt: application.submitted_at,
        updatedAt: application.updated_at,
        personalInfo: application.personal_info,
        documents: application.documents,
        emergencyContact: application.emergency_contact,
        reviewNotes: application.review_notes,
        approvedAt: application.approved_at,
        rejectedAt: application.rejected_at
      }
    });

  } catch (error) {
    console.error('Application fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: 'APPLICATION_FETCH_FAILED'
    });
  }
});

// Update application (only if in DRAFT status)
router.put('/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { personalInfo, documents, emergencyContact } = req.body;

    // Check if application exists and belongs to user
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('license_applications')
      .select('status')
      .eq('id', applicationId)
      .eq('citizen_id', req.citizenId)
      .single();

    if (fetchError || !existingApp) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: 'APPLICATION_NOT_FOUND'
      });
    }

    // Only allow updates to DRAFT applications
    if (existingApp.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update application in current status',
        error: 'APPLICATION_NOT_EDITABLE'
      });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (personalInfo) updateData.personal_info = personalInfo;
    if (documents) updateData.documents = documents;
    if (emergencyContact) updateData.emergency_contact = emergencyContact;

    const { data: application, error: updateError } = await supabaseAdmin
      .from('license_applications')
      .update(updateData)
      .eq('id', applicationId)
      .eq('citizen_id', req.citizenId)
      .select()
      .single();

    if (updateError) {
      console.error('Application update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update application',
        error: 'APPLICATION_UPDATE_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      application: {
        id: application.id,
        status: application.status,
        licenseType: application.license_type,
        submittedAt: application.submitted_at,
        updatedAt: application.updated_at,
        personalInfo: application.personal_info,
        documents: application.documents,
        emergencyContact: application.emergency_contact
      }
    });

  } catch (error) {
    console.error('Application update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: 'APPLICATION_UPDATE_FAILED'
    });
  }
});

// Submit draft application
router.post('/:applicationId/submit', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const { data: application, error: updateError } = await supabaseAdmin
      .from('license_applications')
      .update({
        status: 'PENDING',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('citizen_id', req.citizenId)
      .eq('status', 'DRAFT')
      .select()
      .single();

    if (updateError || !application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or cannot be submitted',
        error: 'APPLICATION_SUBMISSION_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        submittedAt: application.submitted_at
      }
    });

  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: 'APPLICATION_SUBMISSION_FAILED'
    });
  }
});

// Get application status
router.get('/:applicationId/status', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const { data: application, error } = await supabaseAdmin
      .from('license_applications')
      .select('id, status, submitted_at, updated_at, review_notes')
      .eq('id', applicationId)
      .eq('citizen_id', req.citizenId)
      .single();

    if (error || !application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: 'APPLICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        submittedAt: application.submitted_at,
        lastUpdated: application.updated_at,
        reviewNotes: application.review_notes
      }
    });

  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application status',
      error: 'STATUS_FETCH_FAILED'
    });
  }
});

export default router;
