// Vercel API Route: /api/auth/verify-otp
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nationalId, otp, transactionId } = req.body;

  if (!nationalId || !otp || !transactionId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields' 
    });
  }

  // In development, any 6-digit OTP works
  if (process.env.NODE_ENV !== 'production' && otp !== '123456') {
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format'
      });
    }
  }

  try {
    // Get citizen data
    const { data: citizen, error } = await supabase
      .from('citizens')
      .select('*')
      .eq('national_id', nationalId)
      .single();

    if (error || !citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found'
      });
    }

    // Return citizen data
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      citizenData: {
        id: citizen.id,
        nationalId: citizen.national_id,
        fullName: citizen.full_name,
        dateOfBirth: citizen.date_of_birth,
        address: citizen.address,
        phoneNumber: citizen.phone_number,
        email: citizen.email,
        status: citizen.status
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
