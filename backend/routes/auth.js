import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, isSupabaseConfigured } from '../config/database.js';
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

    let citizen;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Use Supabase
      const { data: citizenData, error: citizenError } = await supabaseAdmin
        .from('citizens')
        .select('*')
        .eq('national_id', nationalId)
        .eq('status', 'ACTIVE')
        .single();

      if (citizenError) {
        console.error('Supabase citizen lookup error:', citizenError);
        return res.status(404).json({
          success: false,
          message: 'National ID not found in the system',
          error: 'CITIZEN_NOT_FOUND',
          debug: citizenError.message
        });
      }
      
      if (!citizenData) {
        return res.status(404).json({
          success: false,
          message: 'National ID not found in the system',
          error: 'CITIZEN_NOT_FOUND'
        });
      }
      
      citizen = citizenData;
    } else {
      // Use dummy data
      citizen = findCitizenByNationalId(nationalId);
      if (!citizen) {
        return res.status(404).json({
          success: false,
          message: 'National ID not found in the system',
          error: 'CITIZEN_NOT_FOUND'
        });
      }
    }

    // Generate transaction and OTP
    const transactionId = generateTransactionId();
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (isSupabaseConfigured && supabaseAdmin) {
      // Store auth session in Supabase
      const { error: sessionError } = await supabaseAdmin
        .from('auth_sessions')
        .insert({
          citizen_id: citizen.id,
          transaction_id: transactionId,
          otp_code: otpCode,
          otp_expires_at: expiresAt.toISOString(),
          status: 'PENDING'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create authentication session',
          error: 'SESSION_CREATION_FAILED'
        });
      }
    } else {
      // Store auth session in memory (dummy data)
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
    }

    // Log for development (remove in production)
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
    console.log('Received OTP request:', req.body);
    const { transactionId } = req.body;

    if (!transactionId) {
      console.log('Missing transaction ID');
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
        error: 'MISSING_TRANSACTION_ID'
      });
    }

    let session, citizen;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Get session info from Supabase
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from('auth_sessions')
        .select(`
          *,
          citizens (
            phone_number,
            full_name
          )
        `)
        .eq('transaction_id', transactionId)
        .eq('status', 'PENDING')
        .single();

      if (sessionError || !sessionData) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired transaction',
          error: 'INVALID_TRANSACTION'
        });
      }
      session = sessionData;
      citizen = sessionData.citizens;
    } else {
      // Get session info from dummy data
      session = findSessionByTransactionId(transactionId);
      if (!session || session.status !== 'PENDING') {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired transaction',
          error: 'INVALID_TRANSACTION'
        });
      }
      citizen = findCitizenById(session.citizen_id);
    }

    // Check if OTP hasn't expired
    if (new Date() > new Date(session.otp_expires_at)) {
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('auth_sessions')
          .update({ status: 'EXPIRED' })
          .eq('id', session.id);
      } else {
        updateSession(transactionId, { status: 'EXPIRED' });
      }

      return res.status(400).json({
        success: false,
        message: 'Transaction has expired',
        error: 'TRANSACTION_EXPIRED'
      });
    }

    // In production, send SMS here using Twilio/etc
    // For demo, we just simulate sending
    console.log(`📱 Sending OTP ${session.otp_code} to ${citizen.phone_number || citizen.full_name}`);

    res.json({
      success: true,
      transactionId,
      message: `OTP sent successfully to ${citizen.phone_number || citizen.full_name}`,
      // Development helper
      ...(process.env.NODE_ENV === 'development' && { 
        debug: { 
          otp: session.otp_code,
          phone: citizen.phone_number || citizen.full_name
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

    let session, citizen;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Get session with citizen data from Supabase
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from('auth_sessions')
        .select(`
          *,
          citizens (*)
        `)
        .eq('transaction_id', transactionId)
        .single();

      if (sessionError || !sessionData) {
        return res.status(404).json({
          success: false,
          message: 'Invalid transaction ID',
          error: 'INVALID_TRANSACTION'
        });
      }
      session = sessionData;
      citizen = sessionData.citizens;
    } else {
      // Get session from dummy data
      session = findSessionByTransactionId(transactionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Invalid transaction ID',
          error: 'INVALID_TRANSACTION'
        });
      }
      citizen = findCitizenById(session.citizen_id);
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
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('auth_sessions')
          .update({ status: 'EXPIRED' })
          .eq('id', session.id);
      } else {
        updateSession(transactionId, { status: 'EXPIRED' });
      }

      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
        error: 'OTP_EXPIRED'
      });
    }

    // Check attempt limit
    if (session.attempts >= 3) {
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('auth_sessions')
          .update({ status: 'FAILED' })
          .eq('id', session.id);
      } else {
        updateSession(transactionId, { status: 'FAILED' });
      }

      return res.status(400).json({
        success: false,
        message: 'Too many attempts. Please start over.',
        error: 'TOO_MANY_ATTEMPTS'
      });
    }

    // Verify OTP - In development, accept any OTP for testing
    const isValidOtp = process.env.NODE_ENV === 'development' ? 
      true : // Accept any OTP in development
      otp === session.otp_code; // Check actual OTP in production
    
    if (!isValidOtp) {
      // Increment attempts
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('auth_sessions')
          .update({ 
            attempts: session.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id);
      } else {
        updateSession(transactionId, { 
          attempts: session.attempts + 1,
          updated_at: new Date().toISOString()
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        error: 'INVALID_OTP',
        attemptsRemaining: 3 - (session.attempts + 1)
      });
    }

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔓 OTP accepted in development mode. User entered: ${otp}, Expected: ${session.otp_code}`);
    }

    // OTP is valid - mark session as verified
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin
        .from('auth_sessions')
        .update({ 
          status: 'VERIFIED',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);
    } else {
      updateSession(transactionId, { 
        status: 'VERIFIED',
        updated_at: new Date().toISOString()
      });
    }

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

    let session;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: sessionData, error } = await supabaseAdmin
        .from('auth_sessions')
        .select('status, attempts, otp_expires_at')
        .eq('transaction_id', transactionId)
        .single();

      if (error || !sessionData) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
          error: 'SESSION_NOT_FOUND'
        });
      }
      session = sessionData;
    } else {
      session = findSessionByTransactionId(transactionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
          error: 'SESSION_NOT_FOUND'
        });
      }
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
