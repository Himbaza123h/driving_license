import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload file to Supabase Storage
const uploadToSupabase = async (file, folder = 'uploads') => {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from('documents')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600'
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('documents')
    .getPublicUrl(filePath);

  return {
    path: data.path,
    url: publicUrl,
    fileName: file.originalname,
    size: file.size,
    mimeType: file.mimetype
  };
};

// Upload profile photo
router.post('/profile-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided',
        error: 'MISSING_FILE'
      });
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabase(req.file, 'profile-photos');

    // Update citizen record with photo URL
    const { error: updateError } = await supabaseAdmin
      .from('citizens')
      .update({
        photo_url: uploadResult.url,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.citizenId);

    if (updateError) {
      console.error('Profile photo update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile photo',
        error: 'PHOTO_UPDATE_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      photo: {
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        size: uploadResult.size
      }
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: 'PHOTO_UPLOAD_FAILED'
    });
  }
});

// Upload application document
router.post('/application-document', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const { documentType, applicationId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided',
        error: 'MISSING_FILE'
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Document type is required',
        error: 'MISSING_DOCUMENT_TYPE'
      });
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabase(req.file, `documents/${documentType}`);

    // If applicationId provided, associate with application
    if (applicationId) {
      const { error: appError } = await supabaseAdmin
        .from('license_applications')
        .select('documents')
        .eq('id', applicationId)
        .eq('citizen_id', req.citizenId)
        .single();

      if (!appError) {
        // Update application documents
        const { error: updateError } = await supabaseAdmin
          .rpc('update_application_document', {
            app_id: applicationId,
            doc_type: documentType,
            doc_url: uploadResult.url
          });

        if (updateError) {
          console.error('Application document update error:', updateError);
        }
      }
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        type: documentType,
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        size: uploadResult.size
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: 'DOCUMENT_UPLOAD_FAILED'
    });
  }
});

// Get uploaded file (with optional auth for public documents)
router.get('/file/:fileName', optionalAuth, async (req, res) => {
  try {
    const { fileName } = req.params;

    // Get file from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .download(fileName);

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
        error: 'FILE_NOT_FOUND'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', data.type || 'application/octet-stream');
    res.setHeader('Content-Length', data.size);
    
    // Stream the file
    data.stream().pipe(res);

  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: 'FILE_DOWNLOAD_FAILED'
    });
  }
});

// Delete uploaded file
router.delete('/file/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;

    // Delete from Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from('documents')
      .remove([fileName]);

    if (error) {
      console.error('File deletion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: 'FILE_DELETION_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: 'FILE_DELETION_FAILED'
    });
  }
});

export default router;
