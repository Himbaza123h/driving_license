import { createContext, useContext, useEffect, useState } from "react";
import { supabaseAdmin } from "../../../../backend/config/database";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const enrichUserWithProfile = (supabaseUser, profile) => {
    if (!supabaseUser) return null;

    return {
      ...supabaseUser,
      roles: profile?.roles || "user",
      name:
        profile?.full_name ||
        profile?.name ||
        supabaseUser.email?.split("@")[0] ||
        "User",
      nationalId: profile?.national_id,
      phoneNumber: profile?.phone_number,
      emailVerified: profile?.email_verified || false,
    };
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabaseAdmin.auth.getSession();

      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUserProfile(profile);
        setUser(enrichUserWithProfile(session.user, profile));
      } else {
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseAdmin.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUserProfile(profile);
        setUser(enrichUserWithProfile(session.user, profile));
      } else {
        setUserProfile(null);
        setUser(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


const signUp = async (email, password, name, nationalId, phoneNumber) => {
  console.log("🚀 SIGNUP FUNCTION START");
  
  try {
    console.log("🔍 Starting signup request..."); // Debug log

    // Validate inputs before sending
    if (!email || !password || !name || !nationalId || !phoneNumber) {
      console.log("❌ Client-side validation failed:", {
        email: !!email,
        password: !!password,
        name: !!name,
        nationalId: !!nationalId,
        phoneNumber: !!phoneNumber,
      });
      const validationResult = {
        success: false,
        error: "Please fill in all required fields",
      };
      console.log("🔙 Returning validation error:", validationResult);
      return validationResult;
    }

    // Clean the phone number - remove spaces except for the formatting
    const cleanedPhoneNumber = phoneNumber.trim();

    // Ensure national ID is clean
    const cleanedNationalId = nationalId.replace(/\s+/g, "").trim();

    // FIX: Use 'fullName' instead of 'name' to match API expectation
    const requestBody = {
      email: email.trim().toLowerCase(),
      password,
      fullName: name.trim(), // CHANGED: was 'name', now 'fullName'
      nationalId: cleanedNationalId,
      phoneNumber: cleanedPhoneNumber,
    };

    console.log("📤 Sending signup request with:", {
      ...requestBody,
      password: "***", // Don't log the password
    });

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📡 Response received - status:", response.status, "ok:", response.ok);

    // Always try to get JSON response
    let result;
    try {
      result = await response.json(); // Use .json() directly instead of .text() then parse
      console.log("📋 Parsed result from API:", result);
    } catch (parseError) {
      console.error("❌ Failed to parse response as JSON:", parseError);
      const parseErrorResult = {
        success: false,
        error: "Invalid response from server. Please try again.",
      };
      console.log("🔙 Returning parse error:", parseErrorResult);
      return parseErrorResult;
    }

    // Check if the response is ok (status 200-299)
    if (!response.ok) {
      console.log("❌ Response not ok, status:", response.status);
      const errorMessage = result?.error || `Server error (${response.status})`;
      const errorResult = {
        success: false,
        error: errorMessage,
      };
      console.log("🔙 Returning error response:", errorResult);
      return errorResult;
    }

    // For successful responses, ensure result has the expected structure
    if (!result || typeof result !== "object") {
      console.log("❌ Invalid result structure:", result);
      const invalidResult = {
        success: false,
        error: "Invalid response from server",
      };
      console.log("🔙 Returning invalid structure error:", invalidResult);
      return invalidResult;
    }

    // Check if the API response indicates success
    if (result.success === true) {
      console.log("✅ API returned success: true");
      const successResult = {
        success: true,
        message: result.message || "Account created successfully! Please check your email for verification.",
        user: result.user || null
      };
      console.log("🔙 Returning success result:", successResult);
      console.log("🏁 SIGNUP FUNCTION END - SUCCESS");
      return successResult;
    } else {
      console.log("❌ API returned success: false or undefined");
      console.log("🔍 Full result object:", JSON.stringify(result, null, 2));
      const failureResult = {
        success: false,
        error: result.error || "Unknown error occurred",
      };
      console.log("🔙 Returning failure result:", failureResult);
      console.log("🏁 SIGNUP FUNCTION END - API FAILURE");
      return failureResult;
    }

  } catch (error) {
    console.error("❌ Signup network error:", error);
    console.error("❌ Error stack:", error.stack);
    const networkErrorResult = {
      success: false,
      error: "Network error. Please check your connection and try again.",
    };
    console.log("🔙 Returning network error:", networkErrorResult);
    console.log("🏁 SIGNUP FUNCTION END - NETWORK ERROR");
    return networkErrorResult;
  }
};

  const signIn = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to sign in";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (parseError) {
          errorMessage = `Server error (${response.status})`;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const result = await response.json();
      return (
        result || { success: false, error: "Invalid response from server" }
      );
    } catch (error) {
      console.error("SignIn network error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Failed to sign out",
        };
      }

      const result = await response.json();
      return result || { success: true };
    } catch (error) {
      console.error("SignOut error:", error);
      return {
        success: false,
        error: "Network error during sign out",
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to send reset email";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (parseError) {
          errorMessage = `Server error (${response.status})`;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const result = await response.json();
      return (
        result || { success: false, error: "Invalid response from server" }
      );
    } catch (error) {
      console.error("ForgotPassword error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const resetPassword = async (password, access_token, refresh_token) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, access_token, refresh_token }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to reset password";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (parseError) {
          errorMessage = `Server error (${response.status})`;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const result = await response.json();
      return (
        result || { success: false, error: "Invalid response from server" }
      );
    } catch (error) {
      console.error("ResetPassword error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const sendVerificationEmail = async (email, userId) => {
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Failed to send verification email",
        };
      }

      const result = await response.json();
      return (
        result || { success: false, error: "Invalid response from server" }
      );
    } catch (error) {
      console.error("Error sending verification email:", error);
      return {
        success: false,
        error: "Network error while sending verification email",
      };
    }
  };

  const resendVerificationEmail = async () => {
    if (user && user.email) {
      return await sendVerificationEmail(user.email, user.id);
    }
    return {
      success: false,
      error: "No user found",
    };
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
