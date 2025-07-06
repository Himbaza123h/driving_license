import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { isSupabaseConfigured } from '../config/database.js';
import { validateNationalId, validateOTP } from '../middleware/validation.js';
import { 
  findCitizenByNationalId, 
  findSessionByTransactionId, 
  addSession, 
  updateSession,
  findCitizenById 
} from '../data/dummyStore.js';

const router = express.Router();

// Generate transaction ID
const generateTransactionId = () => {
  return `txn_${uuidv4().substring(0, 8)}_${Date.now()}`;
};

// Generate OTP (for demo purposes, always 123456)
const generateOTP = () => {
  // In production, generate random 6-digit OTP
  return process.env.NODE_ENV === 'production' ? 
    Math.floor(100000 + Math.random() * 900000).toString() : 
    '123456';
};

// Step 1: Initiate authentication with National ID
router.post('/initiate', validateNationalId, async (req, res) => {
  try {
    const { nationalId } = req.body;

    // Check if citizen exists (use dummy data if Supabase not configured)
    let citizen;
    
    if (isSupabaseConfigured) {
      // TODO: Use Supabase when configured
      return res.status(503).json({
        success: false,
        message: 'Supabase integration not yet implemented',
        error: 'SUPABASE_NOT_IMPLEMENTED'
      });
    } else {
      // Use dummy data
      citizen = findCitizenByNationalId(nationalId);
    }

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'National ID not found in the system',
        error: 'CITIZEN_NOT_FOUND'
      });
    }

    // Generate transaction and OTP
    const transactionId = generateTransactionId();
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store auth session (in memory for now)
    const session = {
      id: Date.now(),
      citizen_id: citizen.id,
      transaction_id: transactionId,
      otp_code: otpCode,
      otp_expires_at: expiresAt.toISOString(),
      status: 'PENDING',
      attempts: 0,
      created_at: new Date().toISOString()
    };

    addSession(session);

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 OTP for ${nationalId}: ${otpCode}`);
    }

    res.json({
      success: true,
      transactionId,
      message: 'Authentication initiated successfully',
      // In development, include OTP for testing
      ...(process.env.NODE_ENV === 'development' && { debug: { otp: otpCode } })
    });

  } catch (error) {
    console.error('Auth initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication initiation failed',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Step 2: Send OTP (simulated - in production would send real SMS)
router.post('/send-otp', async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
        error: 'MISSING_TRANSACTION_ID'
      });
    }

    // Get session info
    const session = findSessionByTransactionId(transactionId);

    if (!session || session.status !== 'PENDING') {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired transaction',
        error: 'INVALID_TRANSACTION'
      });
    }

    // Check if OTP hasn't expired
    if (new Date() > new Date(session.otp_expires_at)) {
      updateSession(transactionId, { status: 'EXPIRED' });

      return res.status(400).json({
        success: false,
        message: 'Transaction has expired',
        error: 'TRANSACTION_EXPIRED'
      });
    }

    const citizen = findCitizenById(session.citizen_id);

    // In production, send SMS here using Twilio/etc
    // For demo, we just simulate sending
    console.log(`📱 Sending OTP ${session.otp_code} to ${citizen.phone_number}`);

    res.json({
      success: true,
      transactionId,
      message: `OTP sent successfully to ${citizen.phone_number}`,
      // Development helper
      ...(process.env.NODE_ENV === 'development' && { 
        debug: { 
          otp: session.otp_code,
          phone: citizen.phone_number 
        } 
      })
    });

  } catch (error) {
    console.error('OTP sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: 'OTP_SEND_FAILED'
    });
  }
});

// Step 3: Verify OTP and authenticate
router.post('/verify-otp', validateOTP, async (req, res) => {
  try {
    const { transactionId, otp } = req.body;

    // Get session
    const session = findSessionByTransactionId(transactionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Invalid transaction ID',
        error: 'INVALID_TRANSACTION'
      });
    }

    // Check session status
    if (session.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not in pending state',
        error: 'INVALID_SESSION_STATUS'
      });
    }

    // Check if OTP expired
    if (new Date() > new Date(session.otp_expires_at)) {
      updateSession(transactionId, { status: 'EXPIRED' });

      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
        error: 'OTP_EXPIRED'
      });
    }

    // Check attempt limit
    if (session.attempts >= 3) {
      updateSession(transactionId, { status: 'FAILED' });

      return res.status(400).json({
        success: false,
        message: 'Too many attempts. Please start over.',
        error: 'TOO_MANY_ATTEMPTS'
      });
    }

    // Verify OTP
    if (otp !== session.otp_code) {
      // Increment attempts
      updateSession(transactionId, { 
        attempts: session.attempts + 1,
        updated_at: new Date().toISOString()
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        error: 'INVALID_OTP',
        attemptsRemaining: 3 - (session.attempts + 1)
      });
    }

    // OTP is valid - mark session as verified
    updateSession(transactionId, { 
      status: 'VERIFIED',
      updated_at: new Date().toISOString()
    });

    // Get citizen data
    const citizen = findCitizenById(session.citizen_id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        citizenId: citizen.id,
        nationalId: citizen.national_id,
        transactionId
      },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    );

    // Return success with citizen data
    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      userData: {
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
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: 'VERIFICATION_FAILED'
    });
  }
});

// Get session status
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const session = findSessionByTransactionId(transactionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
        error: 'SESSION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      transactionId,
      status: session.status,
      attempts: session.attempts,
      expiresAt: session.otp_expires_at
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session status',
      error: 'STATUS_CHECK_FAILED'
    });
  }
});

export default router;
