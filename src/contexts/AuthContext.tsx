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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, nationalId?: string, phoneNumber?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithNationalId: (nationalIdData: NationalIdData) => Promise<void>;
  signOut: () => Promise<void>;
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
          }
        }
      } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent hydration issues
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Starting sign in process for:', email);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log('AuthContext: API Response status:', response.status);
      console.log('AuthContext: API Response data:', result);

      if (!response.ok) {
        console.log('AuthContext: Login failed with status:', response.status);
        console.log('AuthContext: Error message:', result.error);
        
        // Throw error with the specific message from the API
        throw new Error(result.error || 'Login failed');
      }

      // Create user object from API response
      const userData: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.profile?.full_name || result.user.email?.split('@')[0] || 'User',
        provider: 'email'
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
        throw new Error(result.error || 'Signup failed');
      }

      // Note: For signup, user might need to verify email first
      // So we might not set the user immediately
      console.log('Signup successful:', result.message);
      
      // If you want to auto-login after signup, you can do:
      // await signIn(email, password);
      
    } catch (error) {
      console.log('Sign up error:', error);
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
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};