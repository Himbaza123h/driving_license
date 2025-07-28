"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

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
  provider: "email" | "google" | "national-id";
  nationalId?: string;
  roles: string;
  nationalIdData?: NationalIdData;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (emailOrPhone: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    nationalId?: string,
    phoneNumber?: string
  ) => Promise<{success: boolean; message?: string; error?: string}>;
  signInWithGoogle: () => Promise<void>;
  signInWithNationalId: (nationalIdData: NationalIdData) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    password: string,
    access_token: string,
    refresh_token: string
  ) => Promise<void>;
  sendVerificationEmail: (email: string, userId: string) => Promise<{success: boolean; error?: string}>;
  resendVerificationEmail: () => Promise<{success: boolean; error?: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session only once on mount
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Validate the stored user object
          if (parsedUser && parsedUser.id && parsedUser.email) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem("user");
            localStorage.removeItem("session");
          }
        }
      } catch (error) {
        console.warn("Failed to parse stored user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("session");
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent hydration issues
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, []);


const signIn = async (emailOrPhone: string, password: string) => {
  console.log("🚀 AuthContext: Starting sign in process for:", emailOrPhone);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailOrPhone, password }),
    });

    console.log("📡 AuthContext: API Response status:", response.status);
    console.log("📡 AuthContext: API Response headers:", Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log("📋 AuthContext: API Response data:", result);

    if (!response.ok) {
      console.log("❌ AuthContext: Login failed with status:", response.status);
      console.log("❌ AuthContext: Error message:", result.error);

      // Handle specific error cases with more detailed messages
      if (response.status === 401) {
        // Check if it's specifically an email verification issue
        if (result.error?.includes('verify') || result.error?.includes('verification') || result.error?.includes('Email not confirmed')) {
          throw new Error("Please verify your email address before signing in. Check your inbox (including spam folder) for a verification link.");
        } else if (result.error?.includes('Password incorrect')) {
          throw new Error("Incorrect password. Please try again.");
        } else {
          // Generic 401 error
          throw new Error(result.error || "Invalid email/phone or password. Please check your credentials.");
        }
      } else if (response.status === 404) {
        throw new Error("No account found with this email or phone number. Please check your details or sign up for a new account.");
      } else if (response.status === 429) {
        throw new Error("Too many login attempts. Please wait a few minutes and try again.");
      } else if (response.status === 400) {
        throw new Error(result.error || "Invalid input. Please check your email/phone and password.");
      } else if (response.status >= 500) {
        throw new Error("Server error. Please try again in a few moments.");
      }

      // Throw error with the specific message from the API
      throw new Error(result.error || "Login failed. Please try again.");
    }

    console.log("✅ AuthContext: API call successful, processing user data");

    // Create user object from API response
    const userData: User = {
      id: result.user.id,
      email: result.user.email,
      name:
        result.profile?.full_name ||
        result.user.email?.split("@")[0] ||
        "User",
      provider: "email",
      nationalId: result.profile?.national_id || result.user.national_id,
      roles: result.profile?.roles || "user",
    };

    console.log("👤 AuthContext: Setting user data:", {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      provider: userData.provider,
      roles: userData.roles
    });

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Store session data if needed
    if (result.session) {
      console.log("💾 AuthContext: Storing session data");
      localStorage.setItem("session", JSON.stringify(result.session));
    }

    console.log("✅ AuthContext: Sign in completed successfully");
  } catch (error) {
    console.log("💥 AuthContext: Sign in error:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
      error: error
    });

    // Make sure to clear any loading states or partial data
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("session");

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Network error. Please check your internet connection and try again."
      );
    }

    // Re-throw the error so the component can handle it
    throw error;
  }
};

  const signUp = async (
    email: string,
    password: string,
    name: string,
    nationalId?: string,
    phoneNumber?: string
  ) => {
    console.log("🚀 TYPESCRIPT SIGNUP FUNCTION START");
    
    try {
      console.log("📤 Sending signup request with:", {
        fullName: name,
        email,
        nationalId,
        phoneNumber,
        password: "***"
      });

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: name,
          email,
          password,
          nationalId,
          phoneNumber,
        }),
      });

      console.log("📡 Response status:", response.status, "ok:", response.ok);

      const result = await response.json();
      console.log("📋 API Response:", result);

      if (!response.ok) {
        console.log("❌ Response not ok");
        // Handle specific error cases with proper error messages
        if (response.status === 409) {
          // Pass through the specific error message from the server
          const errorResult = {
            success: false,
            error: result.error || "An account with this information already exists"
          };
          console.log("🔙 Returning 409 error:", errorResult);
          return errorResult;
        } else if (response.status === 400) {
          const errorResult = {
            success: false,
            error: result.error || "Invalid registration data"
          };
          console.log("🔙 Returning 400 error:", errorResult);
          return errorResult;
        } else if (response.status >= 500) {
          const errorResult = {
            success: false,
            error: "Server error. Please try again later."
          };
          console.log("🔙 Returning 500 error:", errorResult);
          return errorResult;
        }

        const errorResult = {
          success: false,
          error: result.error || "Signup failed"
        };
        console.log("🔙 Returning general error:", errorResult);
        return errorResult;
      }

      console.log("✅ Signup successful:", result.message);

      // FIXED: Return the success result instead of void
      const successResult = {
        success: true,
        message: result.message || "Account created successfully! Please check your email for verification."
      };
      console.log("🔙 Returning success result:", successResult);
      console.log("🏁 TYPESCRIPT SIGNUP FUNCTION END - SUCCESS");
      return successResult;

    } catch (error) {
      console.log("❌ Sign up error:", error);

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkErrorResult = {
          success: false,
          error: "Network error. Please check your connection and try again."
        };
        console.log("🔙 Returning network error:", networkErrorResult);
        console.log("🏁 TYPESCRIPT SIGNUP FUNCTION END - NETWORK ERROR");
        return networkErrorResult;
      }

      const unknownErrorResult = {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred"
      };
      console.log("🔙 Returning unknown error:", unknownErrorResult);
      console.log("🏁 TYPESCRIPT SIGNUP FUNCTION END - UNKNOWN ERROR");
      return unknownErrorResult;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Simulate Google OAuth
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: "2",
        email: "user@gmail.com",
        name: "Google User",
        provider: "google",
        roles: "user"
      };

      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
    } catch (error) {
      console.log("Google sign in error:", error);
      throw new Error("Google sign-in failed");
    }
  };

  const signInWithNationalId = async (nationalIdData: NationalIdData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockUser: User = {
        id: nationalIdData.nationalId,
        email: nationalIdData.email || `${nationalIdData.nationalId}@gov.bi`,
        name: nationalIdData.fullName,
        provider: "national-id",
        nationalId: nationalIdData.nationalId,
        nationalIdData,
        roles: "user"
      };

      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
    } catch (error) {
      console.log("National ID sign in error:", error);
      throw new Error("National ID authentication failed");
    }
  };

  const forgotPassword = async (email: string) => {
    console.log("AuthContext: Starting forgot password process for:", email);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log(
        "AuthContext: Forgot password API Response status:",
        response.status
      );
      console.log("AuthContext: Forgot password API Response data:", result);

      if (!response.ok) {
        console.log(
          "AuthContext: Forgot password failed with status:",
          response.status
        );
        console.log("AuthContext: Error message:", result.error);

        // Handle specific error cases
        if (response.status === 404) {
          throw new Error("No account found with this email address");
        } else if (response.status === 429) {
          throw new Error("Too many reset requests. Please try again later.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }

        throw new Error(result.error || "Failed to send reset email");
      }

      console.log("AuthContext: Forgot password successful");
    } catch (error) {
      console.log("AuthContext: Forgot password error:", error);

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }

      throw error;
    }
  };

  const resetPassword = async (
    password: string,
    access_token: string,
    refresh_token: string
  ) => {
    console.log("AuthContext: Starting reset password process");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, access_token, refresh_token }),
      });

      const result = await response.json();
      console.log(
        "AuthContext: Reset password API Response status:",
        response.status
      );
      console.log("AuthContext: Reset password API Response data:", result);

      if (!response.ok) {
        console.log(
          "AuthContext: Reset password failed with status:",
          response.status
        );
        console.log("AuthContext: Error message:", result.error);

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Invalid or expired reset token");
        } else if (response.status === 400) {
          throw new Error(result.error || "Invalid password format");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }

        throw new Error(result.error || "Failed to reset password");
      }

      console.log("AuthContext: Reset password successful");

      // Clear any existing user data as the password has been reset
      // User will need to log in again with new password
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("session");
    } catch (error) {
      console.log("AuthContext: Reset password error:", error);

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }

      throw error;
    }
  };

const sendVerificationEmail = async (email: string, userId: string) => {
  try {
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send verification email');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const resendVerificationEmail = async () => {
  if (!user) {
    return {
      success: false,
      error: 'No user found',
    };
  }

  return sendVerificationEmail(user.email, user.id);
};

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("session");
      // Clear all localStorage data
      localStorage.clear();
      // Clear all sessionStorage data
      sessionStorage.clear();
    } catch (error) {
      console.log("Sign out error:", error);
      // Still clear local state even if API call fails
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("session");
      // Clear all localStorage data
      localStorage.clear();
      // Clear all sessionStorage data
      sessionStorage.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithNationalId,
        signOut,
        forgotPassword,
        resetPassword,
        sendVerificationEmail,
        resendVerificationEmail,

      }}
    >
      {children}
    </AuthContext.Provider>
  );
};