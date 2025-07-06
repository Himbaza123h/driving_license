import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import citizenRoutes from './routes/citizens.js';
import applicationRoutes from './routes/applications.js';
import uploadRoutes from './routes/uploads.js';
import healthRoutes from './routes/health.js';

// Import middleware
import { errorHandler, requestLogger } from './middleware/errors.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8090;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? '*' : [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001' // Add port 3001 for development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Log CORS requests in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url} from ${req.headers.origin || 'unknown origin'}`);
    next();
  });
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/uploads', uploadRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: '🇧🇮 DLV Burundi API Server',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      citizens: '/api/citizens',
      applications: '/api/applications',
      uploads: '/api/uploads'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: ['/api/health', '/api/auth', '/api/citizens', '/api/applications', '/api/uploads']
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('🚀 DLV Burundi Backend Server Started');
  console.log('=======================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API Docs: http://localhost:${PORT}/`);
  console.log('=======================================');
});

export default app;
