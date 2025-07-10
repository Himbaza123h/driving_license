"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define a simplified interface for National ID data
interface NationalIdData {
  nationalId: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  email?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google' | 'national-id';
  nationalId?: string;
  nationalIdData?: NationalIdData;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (emailOrPhone: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, nationalId?: string, phoneNumber?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithNationalId: (nationalIdData: NationalIdData) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string, access_token: string, refresh_token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session only once on mount
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Validate the stored user object
          if (parsedUser && parsedUser.id && parsedUser.email) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem('user');
            localStorage.removeItem('session');
          }
        }
      } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('session');
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent hydration issues
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, []);

  const signIn = async (emailOrPhone: string, password: string) => {
    console.log('AuthContext: Starting sign in process for:', emailOrPhone);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const result = await response.json();
      console.log('AuthContext: API Response status:', response.status);
      console.log('AuthContext: API Response data:', result);

      if (!response.ok) {
        console.log('AuthContext: Login failed with status:', response.status);
        console.log('AuthContext: Error message:', result.error);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Unverified, invalid email/phone or password \n Please check you email and verify');
        } else if (response.status === 404) {
          throw new Error('Account not found');
        } else if (response.status === 429) {
          throw new Error('Too many login attempts. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        // Throw error with the specific message from the API
        throw new Error(result.error || 'Login failed');
      }

      // Create user object from API response
      const userData: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.profile?.full_name || result.user.email?.split('@')[0] || 'User',
        provider: 'email',
        nationalId: result.profile?.national_id || result.user.national_id
      };
      
      console.log('AuthContext: Setting user data:', userData);
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Store session data if needed
      if (result.session) {
        localStorage.setItem('session', JSON.stringify(result.session));
      }
      
      console.log('AuthContext: Sign in successful');
      
    } catch (error) {
      console.log('AuthContext: Sign in error:', error);
      
      // Make sure to clear any loading states or partial data
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Re-throw the error so the component can handle it
      throw error;
    }
  };

const signUp = async (email: string, password: string, name: string, nationalId?: string, phoneNumber?: string) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fullName: name, 
        email, 
        password, 
        nationalId, 
        phoneNumber 
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle specific error cases with proper error messages
      if (response.status === 409) {
        // Pass through the specific error message from the server
        throw new Error(result.error || 'An account with this information already exists');
      } else if (response.status === 400) {
        throw new Error(result.error || 'Invalid registration data');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error(result.error || 'Signup failed');
    }

    console.log('Signup successful:', result.message);
    
    // If you want to auto-login after signup, you can do:
    // await signIn(email, password);
    
  } catch (error) {
    console.log('Sign up error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw error; // Re-throw to be handled by the component
  }
};

  const signInWithGoogle = async () => {
    try {
      // Simulate Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '2',
        email: 'user@gmail.com',
        name: 'Google User',
        provider: 'google'
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.log('Google sign in error:', error);
      throw new Error('Google sign-in failed');
    }
  };

  const signInWithNationalId = async (nationalIdData: NationalIdData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUser: User = {
        id: nationalIdData.nationalId,
        email: nationalIdData.email || `${nationalIdData.nationalId}@gov.bi`,
        name: nationalIdData.fullName,
        provider: 'national-id',
        nationalId: nationalIdData.nationalId,
        nationalIdData
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.log('National ID sign in error:', error);
      throw new Error('National ID authentication failed');
    }
  };

  const forgotPassword = async (email: string) => {
    console.log('AuthContext: Starting forgot password process for:', email);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log('AuthContext: Forgot password API Response status:', response.status);
      console.log('AuthContext: Forgot password API Response data:', result);

      if (!response.ok) {
        console.log('AuthContext: Forgot password failed with status:', response.status);
        console.log('AuthContext: Error message:', result.error);
        
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error('No account found with this email address');
        } else if (response.status === 429) {
          throw new Error('Too many reset requests. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(result.error || 'Failed to send reset email');
      }

      console.log('AuthContext: Forgot password successful');
      
    } catch (error) {
      console.log('AuthContext: Forgot password error:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  };

  const resetPassword = async (password: string, access_token: string, refresh_token: string) => {
    console.log('AuthContext: Starting reset password process');
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, access_token, refresh_token }),
      });

      const result = await response.json();
      console.log('AuthContext: Reset password API Response status:', response.status);
      console.log('AuthContext: Reset password API Response data:', result);

      if (!response.ok) {
        console.log('AuthContext: Reset password failed with status:', response.status);
        console.log('AuthContext: Error message:', result.error);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid or expired reset token');
        } else if (response.status === 400) {
          throw new Error(result.error || 'Invalid password format');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(result.error || 'Failed to reset password');
      }

      console.log('AuthContext: Reset password successful');
      
      // Clear any existing user data as the password has been reset
      // User will need to log in again with new password
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      
    } catch (error) {
      console.log('AuthContext: Reset password error:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('session');
    } catch (error) {
      console.log('Sign out error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('session');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithNationalId,
      signOut,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};