/**
 * Request validation middleware
 */

export const validateNationalId = (req, res, next) => {
  const { nationalId } = req.body;

  if (!nationalId) {
    return res.status(400).json({
      success: false,
      message: 'National ID is required',
      error: 'MISSING_NATIONAL_ID'
    });
  }

  // Basic format validation (adjust based on Burundi National ID format)
  if (typeof nationalId !== 'string' || nationalId.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Invalid National ID format',
      error: 'INVALID_NATIONAL_ID_FORMAT'
    });
  }

  next();
};

export const validateOTP = (req, res, next) => {
  const { transactionId, otp } = req.body;

  if (!transactionId) {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID is required',
      error: 'MISSING_TRANSACTION_ID'
    });
  }

  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'OTP is required',
      error: 'MISSING_OTP'
    });
  }

  if (typeof otp !== 'string' || otp.length !== 6) {
    return res.status(400).json({
      success: false,
      message: 'OTP must be 6 digits',
      error: 'INVALID_OTP_FORMAT'
    });
  }

  next();
};

export const validateLicenseApplication = (req, res, next) => {
  const { 
    personalInfo, 
    documents, 
    emergencyContact 
  } = req.body;

  // Validate personal info
  if (!personalInfo || !personalInfo.fullName || !personalInfo.dateOfBirth) {
    return res.status(400).json({
      success: false,
      message: 'Personal information is incomplete',
      error: 'INCOMPLETE_PERSONAL_INFO'
    });
  }

  // Validate documents
  if (!documents || !documents.nationalIdPhoto || !documents.medicalCertificate) {
    return res.status(400).json({
      success: false,
      message: 'Required documents are missing',
      error: 'MISSING_DOCUMENTS'
    });
  }

  // Validate emergency contact
  if (!emergencyContact || !emergencyContact.name || !emergencyContact.phone) {
    return res.status(400).json({
      success: false,
      message: 'Emergency contact information is required',
      error: 'MISSING_EMERGENCY_CONTACT'
    });
  }

  next();
};
