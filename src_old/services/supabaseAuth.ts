// Simplified authentication service using only Supabase
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig, validateEnvironment } from '../config/environment';

export interface CitizenData {
  id: number;
  nationalId: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  email?: string;
  status: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  citizenData?: CitizenData;
}

class SupabaseAuthService {
  private supabase;

  constructor() {
    try {
      // Validate environment variables first
      validateEnvironment();
      
      console.log('🔧 SupabaseAuthService - Environment config:', {
        url: supabaseConfig.url,
        anonKey: supabaseConfig.anonKey ? `${supabaseConfig.anonKey.substring(0, 20)}...` : 'missing',
        serviceRoleKey: supabaseConfig.serviceRoleKey ? `${supabaseConfig.serviceRoleKey.substring(0, 20)}...` : 'missing'
      });

      // Use service role key for full database access during development
      // In production, this should be handled by the backend API
      const key = supabaseConfig.serviceRoleKey || supabaseConfig.anonKey;
      
      this.supabase = createClient(supabaseConfig.url, key);
      
      console.log('🔧 Supabase Auth Service initialized');
      console.log('🔧 Using URL:', supabaseConfig.url);
      console.log('🔧 Using key type:', supabaseConfig.serviceRoleKey ? 'service_role' : 'anon');
    } catch (error) {
      console.error('❌ Failed to initialize SupabaseAuthService:', error);
      throw error;
    }
  }

  // Step 1: Verify National ID exists and send OTP
  async initiateAuth(nationalId: string): Promise<AuthResponse> {
    try {
      console.log('🔍 Looking up National ID:', nationalId);
      console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔍 Service Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
      
      // Look up citizen in Supabase
      console.log('🔍 Executing query: SELECT * FROM citizens WHERE national_id =', nationalId, 'AND status = ACTIVE');
      const { data: citizen, error } = await this.supabase
        .from('citizens')
        .select('*')
        .eq('national_id', nationalId)
        .eq('status', 'ACTIVE')
        .single();

      console.log('🔍 Query result:', { citizen, error });

      if (error) {
        console.log('❌ Supabase error:', error);
        return {
          success: false,
          message: `Database error: ${error.message}`
        };
      }

      if (!citizen) {
        console.log('❌ No citizen found for National ID:', nationalId);
        
        // Let's also try a broader search to see what's in the table
        console.log('🔍 Checking all citizens in table...');
        const { data: allCitizens, error: allError } = await this.supabase
          .from('citizens')
          .select('national_id, full_name, status')
          .limit(10);
        
        console.log('🔍 All citizens:', allCitizens);
        console.log('🔍 All citizens error:', allError);
        
        return {
          success: false,
          message: 'National ID not found. Please check and try again.'
        };
      }

      console.log('✅ Citizen found:', citizen.full_name);

      // Generate OTP and transaction ID
      const otp = this.generateOTP();
      const transactionId = this.generateTransactionId();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP session in Supabase
      const { error: sessionError } = await this.supabase
        .from('auth_sessions')
        .insert({
          citizen_id: citizen.id,
          transaction_id: transactionId,
          otp_code: otp,
          otp_expires_at: expiresAt.toISOString(),
          status: 'PENDING'
        });

      if (sessionError) {
        console.error('❌ Failed to create auth session:', sessionError);
        return {
          success: false,
          message: 'Failed to initiate authentication. Please try again.'
        };
      }

      console.log(`📱 OTP generated: ${otp} (expires: ${expiresAt.toLocaleTimeString()})`);

      return {
        success: true,
        message: `OTP sent to ${citizen.phone_number}`,
        transactionId
      };

    } catch (error) {
      console.error('❌ Auth initiation error:', error);
      return {
        success: false,
        message: 'Connection error. Please try again.'
      };
    }
  }

  // Step 2: Verify OTP and return citizen data
  async verifyOtp(nationalId: string, otp: string, transactionId: string): Promise<AuthResponse> {
    try {
      console.log('🔍 Verifying OTP:', { nationalId, otp, transactionId });

      // Get the auth session with citizen data
      const { data: session, error: sessionError } = await this.supabase
        .from('auth_sessions')
        .select(`
          *,
          citizens (
            id,
            national_id,
            full_name,
            date_of_birth,
            address,
            phone_number,
            email,
            status
          )
        `)
        .eq('transaction_id', transactionId)
        .eq('status', 'PENDING')
        .single();

      if (sessionError || !session) {
        console.log('❌ Invalid transaction ID:', sessionError);
        return {
          success: false,
          message: 'Invalid or expired session. Please try again.'
        };
      }

      // Check if session is expired
      if (new Date() > new Date(session.otp_expires_at)) {
        console.log('❌ OTP expired');
        
        // Mark session as expired
        await this.supabase
          .from('auth_sessions')
          .update({ status: 'EXPIRED' })
          .eq('id', session.id);

        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }

      // Verify OTP (in development, accept any 6-digit code or the actual OTP)
      const isValidOTP = process.env.NODE_ENV === 'development' 
        ? (otp === session.otp_code || /^\d{6}$/.test(otp))
        : otp === session.otp_code;

      if (!isValidOTP) {
        console.log('❌ Invalid OTP');
        
        // Increment attempts
        const newAttempts = session.attempts + 1;
        const updateData: { attempts: number; status?: string } = { attempts: newAttempts };
        
        // Mark as failed after 3 attempts
        if (newAttempts >= 3) {
          updateData.status = 'FAILED';
        }

        await this.supabase
          .from('auth_sessions')
          .update(updateData)
          .eq('id', session.id);

        return {
          success: false,
          message: newAttempts >= 3 
            ? 'Too many failed attempts. Please try again later.'
            : `Invalid OTP. ${3 - newAttempts} attempts remaining.`
        };
      }

      // Success! Mark session as verified
      await this.supabase
        .from('auth_sessions')
        .update({ status: 'VERIFIED' })
        .eq('id', session.id);

      console.log('✅ OTP verification successful');

      return {
        success: true,
        message: 'Authentication successful',
        citizenData: {
          id: session.citizens.id,
          nationalId: session.citizens.national_id,
          fullName: session.citizens.full_name,
          dateOfBirth: session.citizens.date_of_birth,
          address: session.citizens.address,
          phoneNumber: session.citizens.phone_number,
          email: session.citizens.email,
          status: session.citizens.status
        }
      };

    } catch (error) {
      console.error('❌ OTP verification error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    }
  }

  // Helper methods
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get citizen data by National ID (for dashboard)
  async getCitizenData(nationalId: string): Promise<CitizenData | null> {
    try {
      const { data: citizen, error } = await this.supabase
        .from('citizens')
        .select('*')
        .eq('national_id', nationalId)
        .eq('status', 'ACTIVE')
        .single();

      if (error || !citizen) {
        return null;
      }

      return {
        id: citizen.id,
        nationalId: citizen.national_id,
        fullName: citizen.full_name,
        dateOfBirth: citizen.date_of_birth,
        address: citizen.address,
        phoneNumber: citizen.phone_number,
        email: citizen.email,
        status: citizen.status
      };
    } catch (error) {
      console.error('Error fetching citizen data:', error);
      return null;
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
