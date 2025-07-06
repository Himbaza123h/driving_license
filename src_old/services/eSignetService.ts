// eSignet Integration Service for National ID Authentication
import { getConfig } from '@/config/environment';

export interface NationalIdData {
  nationalId: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  email?: string;
  photo?: string;
}

export interface AuthRequest {
  nationalId: string;
  transactionId?: string;
}

export interface OtpRequest {
  nationalId: string;
  otp: string;
  transactionId: string;
}

export interface AuthResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  userData?: NationalIdData;
  error?: string;
}

class ESignetService {
  private baseUrl: string;
  private mockIdentityUrl: string;
  private isMock: boolean;

  constructor() {
    const config = getConfig();
    
    // Use environment-specific configuration
    // Priority: Environment variable -> Config -> Default
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 
                   config.BACKEND_API_URL || 
                   'http://localhost:8090/api';
    // Legacy property - no longer used since we switched to Supabase direct
    this.mockIdentityUrl = process.env.NEXT_PUBLIC_MOCK_IDENTITY_URL || 'http://localhost:8088';
    this.isMock = config.IS_MOCK;
    
    // Log configuration in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 eSignet Service Configuration:', {
        environment: process.env.NODE_ENV,
        backendUrl: this.baseUrl,
        identityUrl: this.mockIdentityUrl,
        isMock: this.isMock
      });
    }
  }

  // Create an AbortController for timeouts
  private createAbortController(timeoutMs = 10000): { controller: AbortController, signal: AbortSignal } {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    
    // Return both the controller and its signal
    return {
      controller,
      signal: controller.signal
    };
  }

  // Step 1: Initiate authentication with National ID
  async initiateAuth(nationalId: string): Promise<AuthResponse> {
    this.logProductionWarning('backend authentication');
    
    const { signal } = this.createAbortController(15000); // 15 second timeout
    
    try {
      console.log('🔄 Initiating auth for National ID:', nationalId);
      const response = await fetch(`${this.baseUrl}/auth/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nationalId
        }),
        signal // Add timeout signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        transactionId: data.transactionId,
        message: data.message
      };
    } catch (error) {
      console.error('Error initiating auth:', error);
      
      // Handle timeout errors specifically
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please try again.'
        };
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Authentication initiation failed'
      };
    }
  }

  // Step 2: Send OTP request
  async sendOtp(request: AuthRequest): Promise<AuthResponse> {
    const { signal } = this.createAbortController(15000); // 15 second timeout
    
    try {
      console.log('🔄 Sending OTP request:', request);
      console.log('🌐 API endpoint:', `${this.baseUrl}/auth/send-otp`);
      
      // Ensure we have a valid transaction ID
      if (!request.transactionId) {
        console.error('❌ Missing transaction ID in sendOtp request');
        return {
          success: false,
          message: 'Missing transaction ID'
        };
      }
      
      // Make the actual request with proper JSON payload
      const requestBody = JSON.stringify({
        transactionId: request.transactionId
      });
      
      console.log('📦 Request body:', requestBody);
      
      // Detailed fetch configuration for debugging
      const requestConfig = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add a unique request ID for tracing in logs
          'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        body: requestBody,
        signal, // Add timeout signal
        // Ensure credentials are included for CORS if needed
        credentials: 'include' as RequestCredentials
      };
      
      console.log('🔧 Request config:', requestConfig);
      
      // Add pre-flight check
      try {
        console.log('🔍 Checking backend connectivity...');
        const healthCheck = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        console.log('🏥 Health check status:', healthCheck.status);
      } catch (healthError) {
        console.error('⚠️ Health check failed:', healthError);
        // Continue anyway, just for debugging purposes
      }
      
      console.log('📤 Sending OTP request now...');
      const response = await fetch(`${this.baseUrl}/auth/send-otp`, requestConfig);

      console.log('📊 OTP response status:', response.status);
      console.log('📋 OTP response headers:', {
        contentType: response.headers.get('content-type'),
        cors: response.headers.get('access-control-allow-origin')
      });
      
      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage = `HTTP error: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('❌ OTP error data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
        }
        return {
          success: false,
          message: errorMessage
        };
      }

      // Parse successful response
      const data = await response.json();
      console.log('✅ OTP success data:', data);
      
      return {
        success: true,
        transactionId: data.transactionId,
        message: data.message
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // Enhanced error handling
      let errorMessage = 'Unknown error occurred';
      
      // Handle timeout errors specifically
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'OTP request timed out. Please try again.';
      } else if (error instanceof TypeError && error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to connect to the server. Please try again later.';
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      console.error('📛 Detailed error information:', {
        type: error?.constructor?.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Step 3: Verify OTP and get user data
  async verifyOtp(request: OtpRequest): Promise<AuthResponse> {
    const { signal } = this.createAbortController(15000); // 15 second timeout
    
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: request.transactionId,
          otp: request.otp
        }),
        signal // Add timeout signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Store authentication token
        if (data.token) {
          localStorage.setItem('dlv_auth_token', data.token);
        }
        
        return {
          success: true,
          message: data.message,
          userData: data.userData,
          transactionId: request.transactionId
        };
      } else {
        return {
          success: false,
          message: data.message || 'OTP verification failed'
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      
      // Handle timeout errors specifically
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'OTP verification timed out. Please try again.'
        };
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'OTP verification failed'
      };
    }
  }

  // Mock OTP validation for development (use 123456)
  async validateMockOtp(otp: string): Promise<boolean> {
    // In production, this should use real SMS verification
    if (this.isMock) {
      return otp === '123456';
    }
    
    // TODO: Implement real OTP validation for production
    // This would integrate with SMS provider (Twilio, etc.)
    throw new Error('Real OTP validation not implemented yet');
  }

  // Authentication token management
  getAuthToken(): string | null {
    return localStorage.getItem('dlv_auth_token');
  }

  clearAuthToken(): void {
    localStorage.removeItem('dlv_auth_token');
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;
    
    try {
      // Simple token expiry check (JWT tokens have expiry in payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Production warning helper
  private logProductionWarning(action: string) {
    if (process.env.NODE_ENV === 'production' && this.isMock) {
      console.warn(`⚠️ PRODUCTION WARNING: Using mock ${action} in production environment!`);
    }
  }

  // Health check for backend services
  async healthCheck(): Promise<{ backend: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      
      return {
        backend: response.ok && data.success,
        message: data.message
      };
    } catch {
      return {
        backend: false,
        message: 'Backend connection failed'
      };
    }
  }
}

export const eSignetService = new ESignetService();
