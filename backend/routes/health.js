import express from 'express';
import { supabaseAdmin } from '../config/database.js';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test database connection
    const { error } = await supabaseAdmin
      .from('citizens')
      .select('count')
      .limit(1);

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'dlv-burundi-backend',
      version: '1.0.0',
      database: error ? 'disconnected' : 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    if (error) {
      healthStatus.database_error = error.message;
      return res.status(503).json(healthStatus);
    }

    res.json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const checks = {
      database: false,
      citizens_table: false,
      auth_sessions_table: false
    };

    // Test citizens table
    const { error: citizensError } = await supabaseAdmin
      .from('citizens')
      .select('count')
      .limit(1);

    checks.citizens_table = !citizensError;

    // Test auth_sessions table
    const { error: sessionsError } = await supabaseAdmin
      .from('auth_sessions')
      .select('count') 
      .limit(1);

    checks.auth_sessions_table = !sessionsError;
    checks.database = checks.citizens_table && checks.auth_sessions_table;

    const allHealthy = Object.values(checks).every(check => check === true);

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      errors: {
        citizens: citizensError?.message,
        sessions: sessionsError?.message
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
