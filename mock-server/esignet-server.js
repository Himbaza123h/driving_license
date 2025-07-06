import express from 'express';
import cors from 'cors';
const app = express();
const port = 8089;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// In-memory storage for sessions
let sessions = {};
let otpStore = {};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'esignet-backend' });
});

// Generate a random transaction ID
function generateTransactionId() {
  return 'txn_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Initiate authentication
app.post('/authorize', (req, res) => {
  const { clientId, scope, responseType, redirectUri, claims } = req.body;
  
  const transactionId = generateTransactionId();
  
  sessions[transactionId] = {
    clientId,
    scope,
    responseType,
    redirectUri,
    claims,
    status: 'initiated',
    createdAt: new Date().toISOString()
  };
  
  res.status(200).json({
    transactionId,
    status: 'success',
    message: 'Authentication initiated'
  });
});

// Send OTP
app.post('/send-otp', (req, res) => {
  const { transactionId, individualId, otpChannels } = req.body;
  
  if (!sessions[transactionId]) {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }
  
  // Generate mock OTP (always 123456 for testing)
  const otp = '123456';
  otpStore[transactionId] = {
    otp,
    individualId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    attempts: 0
  };
  
  sessions[transactionId].status = 'otp-sent';
  sessions[transactionId].individualId = individualId;
  
  res.status(200).json({
    transactionId,
    status: 'success',
    message: `OTP sent to ${otpChannels.join(', ')}`
  });
});

// Authenticate (verify OTP)
app.post('/authenticate', (req, res) => {
  const { transactionId, challengeList } = req.body;
  
  if (!sessions[transactionId]) {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }
  
  if (!otpStore[transactionId]) {
    return res.status(400).json({ error: 'No OTP found for this transaction' });
  }
  
  const storedOtp = otpStore[transactionId];
  const providedOtp = challengeList[0]?.challenge;
  
  // Check if OTP has expired
  if (new Date() > storedOtp.expiresAt) {
    return res.status(400).json({ 
      error: 'OTP has expired',
      authStatus: 'FAILED'
    });
  }
  
  // Check attempts
  storedOtp.attempts++;
  if (storedOtp.attempts > 3) {
    return res.status(400).json({ 
      error: 'Too many attempts',
      authStatus: 'FAILED'
    });
  }
  
  // Verify OTP
  if (providedOtp !== storedOtp.otp) {
    return res.status(400).json({ 
      error: 'Invalid OTP',
      authStatus: 'FAILED'
    });
  }
  
  // Success
  sessions[transactionId].status = 'authenticated';
  delete otpStore[transactionId]; // Clean up used OTP
  
  res.status(200).json({
    transactionId,
    authStatus: 'SUCCESS',
    message: 'Authentication successful'
  });
});

// Get authentication status
app.get('/auth-status/:transactionId', (req, res) => {
  const { transactionId } = req.params;
  const session = sessions[transactionId];
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.status(200).json({
    transactionId,
    status: session.status,
    individualId: session.individualId || null
  });
});

// Clean up expired sessions (run every hour)
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  Object.keys(sessions).forEach(transactionId => {
    const session = sessions[transactionId];
    if (new Date(session.createdAt) < oneHourAgo) {
      delete sessions[transactionId];
      delete otpStore[transactionId];
    }
  });
}, 60 * 60 * 1000);

app.listen(port, '0.0.0.0', () => {
  console.log(`Mock eSignet Backend running at http://0.0.0.0:${port}`);
});
