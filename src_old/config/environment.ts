// Supabase configuration - uses environment variables from .env file
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  // Service role key should only be used in development/testing
  serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '',
};

// Application configuration for different deployment stages
export const config = {
  development: {
    BACKEND_API_URL: 'http://localhost:8090/api',
    IS_MOCK: true,
    OTP_VALIDATION: 'mock', // Always 123456
    ENVIRONMENT_LABEL: 'Development',
    USE_DIRECT_SUPABASE: true, // Use direct Supabase queries instead of backend API
  },
  
  staging: {
    BACKEND_API_URL: 'https://staging-backend.burundi.gov.bi/api',
    IS_MOCK: true,
    OTP_VALIDATION: 'real', // Real SMS integration
    ENVIRONMENT_LABEL: 'Demo/Testing Environment',
    USE_DIRECT_SUPABASE: true,
  },
  
  production: {
    BACKEND_API_URL: 'https://backend.burundi.gov.bi/api',
    IS_MOCK: false,
    OTP_VALIDATION: 'real', // Real SMS integration
    ENVIRONMENT_LABEL: 'Production',
    USE_DIRECT_SUPABASE: true,
  }
};

export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return config[env as keyof typeof config] || config.development;
};

// Validate environment variables
export const validateEnvironment = () => {
  if (!supabaseConfig.url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!supabaseConfig.anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  return true;
};
