import express from 'express';
import { supabaseAdmin } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get citizen profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: citizen, error } = await supabaseAdmin
      .from('citizens')
      .select('*')
      .eq('id', req.citizenId)
      .single();

    if (error || !citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen profile not found',
        error: 'PROFILE_NOT_FOUND'
      });
    }

    // Don't return internal fields
    const profile = {
      nationalId: citizen.national_id,
      fullName: citizen.full_name,
      dateOfBirth: citizen.date_of_birth,
      address: citizen.address,
      phoneNumber: citizen.phone_number,
      email: citizen.email,
      photoUrl: citizen.photo_url
    };

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: 'PROFILE_FETCH_FAILED'
    });
  }
});

// Update citizen profile (limited fields)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, email, address } = req.body;
    
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only update provided fields
    if (phoneNumber) updateData.phone_number = phoneNumber;
    if (email) updateData.email = email;
    if (address) updateData.address = address;

    const { data: citizen, error } = await supabaseAdmin
      .from('citizens')
      .update(updateData)
      .eq('id', req.citizenId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: 'PROFILE_UPDATE_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        nationalId: citizen.national_id,
        fullName: citizen.full_name,
        dateOfBirth: citizen.date_of_birth,
        address: citizen.address,
        phoneNumber: citizen.phone_number,
        email: citizen.email,
        photoUrl: citizen.photo_url
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: 'PROFILE_UPDATE_FAILED'
    });
  }
});

// Get citizen's license applications
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const { data: applications, error } = await supabaseAdmin
      .from('license_applications')
      .select('*')
      .eq('citizen_id', req.citizenId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Applications fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
        error: 'APPLICATIONS_FETCH_FAILED'
      });
    }

    res.json({
      success: true,
      applications: applications || []
    });

  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: 'APPLICATIONS_FETCH_FAILED'
    });
  }
});

export default router;
