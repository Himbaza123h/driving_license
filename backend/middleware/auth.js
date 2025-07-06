import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/database.js';

/**
 * JWT Authentication middleware
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
      error: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify the citizen still exists and is active
    const { data: citizen, error } = await supabaseAdmin
      .from('citizens')
      .select('id, national_id, status')
      .eq('id', decoded.citizenId)
      .eq('status', 'ACTIVE')
      .single();

    if (error || !citizen) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN'
      });
    }

    req.citizen = citizen;
    req.citizenId = decoded.citizenId;
    req.nationalId = decoded.nationalId;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid token',
      error: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

/**
 * Optional authentication - continues even if no token
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: citizen, error } = await supabaseAdmin
      .from('citizens')
      .select('id, national_id, status')
      .eq('id', decoded.citizenId)
      .eq('status', 'ACTIVE')
      .single();

    if (!error && citizen) {
      req.citizen = citizen;
      req.citizenId = decoded.citizenId;
      req.nationalId = decoded.nationalId;
    }
  } catch (error) {
    // Ignore token errors for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};
