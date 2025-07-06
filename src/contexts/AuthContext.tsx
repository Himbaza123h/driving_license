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
  signUp: (email: string, password: string, name: string) => Promise<void>;
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
    setIsLoading(true);
    try {
      // Simulate API call - password would be used for actual authentication
      console.log('Signing in with:', email, password);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful sign in
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        provider: 'email'
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch {
      throw new Error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };
  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Simulate API call - password would be used for actual account creation
      console.log('Creating account for:', email, name, password);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful sign up
      const mockUser: User = {
        id: '1',
        email,
        name,
        provider: 'email'
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch {
      throw new Error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };  const signInWithGoogle = async () => {
    setIsLoading(true);
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
    } catch {
      throw new Error('Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithNationalId = async (nationalIdData: NationalIdData) => {
    setIsLoading(true);
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
    } catch {
      throw new Error('National ID authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('user');
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