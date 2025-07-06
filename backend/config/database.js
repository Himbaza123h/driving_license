import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseAnonKey && supabaseServiceKey && 
    supabaseUrl !== 'your_supabase_url_here' && 
    supabaseAnonKey !== 'your_supabase_anon_key_here' &&
    supabaseServiceKey !== 'your_supabase_service_role_key_here' &&
    !supabaseUrl.includes('your-project.supabase') &&
    supabaseUrl.startsWith('http')) {
  
  try {
    // Client for regular operations (with RLS)
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client for privileged operations (bypasses RLS)
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    isSupabaseConfigured = true;
    console.log('✅ Supabase configured successfully');
    console.log('📊 Database URL:', supabaseUrl?.substring(0, 30) + '...');
  } catch (error) {
    console.log('⚠️ Supabase configuration failed, using dummy data:', error.message);
  }
} else {
  console.log('⚠️ Supabase not configured, using dummy data for development');
}

// Database configuration
export const dbConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
  isConfigured: isSupabaseConfigured
};

export { supabase, supabaseAdmin, isSupabaseConfigured };
