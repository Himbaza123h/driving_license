"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SignInProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword?: () => void;
}

const SignIn: React.FC<SignInProps> = ({
  onSwitchToSignUp,
  onSwitchToForgotPassword,
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const formatPhoneInput = (value: string) => {
    // If it's empty, return empty
    if (!value) return "";

    // If first character is a letter, treat as email - return as is
    if (/^[a-zA-Z]/.test(value)) {
      return value;
    }

    // If first character is a number, treat as phone and format
    if (/^\d/.test(value)) {
      // Remove all non-numeric characters
      const digitsOnly = value.replace(/\D/g, "");

      // If empty after cleaning, return empty
      if (!digitsOnly) return "";

      // Format as phone number without +257 prefix for display
      // User enters: 78272823 -> Display: 78 272 823
      let formatted = digitsOnly;

      if (digitsOnly.length > 2) {
        formatted = digitsOnly.substring(0, 2) + " " + digitsOnly.substring(2);
      }

      if (digitsOnly.length > 5) {
        formatted =
          digitsOnly.substring(0, 2) +
          " " +
          digitsOnly.substring(2, 5) +
          " " +
          digitsOnly.substring(5, 8);
      }

      // Limit to 8 digits (XX XXX XXX)
      if (digitsOnly.length > 8) {
        return formatPhoneInput(digitsOnly.substring(0, 8));
      }

      return formatted;
    }

    // If starts with something else, return as is
    return value;
  };

  const handleEmailOrPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneInput(value);
    setEmailOrPhone(formatted);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const getInputType = (value: string) => {
    return value.includes("@") ? "email" : "tel";
  };

  const getPlaceholder = () => {
    // If starts with letter, it's email
    if (/^[a-zA-Z]/.test(emailOrPhone)) {
      return "Enter your email address";
    }
    // If starts with number or empty, show phone placeholder
    return "Email or phone (e.g. 78 272 823)";
  };

  const validateInput = (value: string) => {
    if (!value || value.trim() === "") return false;

    // If it's an email
    if (value.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }

    // If it's a phone number (8 digits without spaces)
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.length === 8;
  };

  const preparePhoneForBackend = (phone: string) => {
    // Remove all non-numeric characters
    const digitsOnly = phone.replace(/\D/g, "");

    // Format as expected by backend: +257 XX XXX XXX
    if (digitsOnly.length === 8) {
      return `+257 ${digitsOnly.substring(0, 2)} ${digitsOnly.substring(
        2,
        5
      )} ${digitsOnly.substring(5, 8)}`;
    }

    return phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const trimmedEmail = emailOrPhone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!validateInput(trimmedEmail)) {
      setError("Please enter a valid email address or phone number");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting to sign in with:", {
        emailOrPhone: trimmedEmail,
      });

      // If it's a phone number, format it for the backend
      const loginIdentifier = trimmedEmail.includes("@")
        ? trimmedEmail
        : preparePhoneForBackend(trimmedEmail);

      console.log("Formatted identifier:", loginIdentifier);

      await signIn(loginIdentifier, trimmedPassword);
      console.log("Login successful");
      // If successful, the user will be redirected by the auth context
    } catch (error) {
      console.log("Login error in component:", error);

      // Always set loading to false on error
      setIsLoading(false);

      // Handle different types of errors
      if (error instanceof Error) {
        console.log("Setting error message:", error.message);
        setError(error.message);
      } else {
        console.log("Setting generic error message");
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleForgotPassword = () => {
    if (onSwitchToForgotPassword) {
      onSwitchToForgotPassword();
    } else {
      // If no handler provided, you could navigate to a forgot password page
      alert("Please provide an email to reset your password");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-lg text-gray-600">
          Sign in to your DLV Burundi account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-lg text-base font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label
            htmlFor="emailOrPhone"
            className="block text-base font-semibold text-gray-700"
          >
            Email or Phone Number
          </label>
          <input
            id="emailOrPhone"
            type={getInputType(emailOrPhone)}
            value={emailOrPhone}
            onChange={handleEmailOrPhoneChange}
            className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-base"
            placeholder={getPlaceholder()}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-3">
          <label
            htmlFor="password"
            className="block text-base font-semibold text-gray-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-5 py-4 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-base"
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
              disabled={isLoading}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-6 h-6" />
              ) : (
                <Eye className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 text-[#2C8E5D] border-gray-300 rounded focus:ring-[#2C8E5D]"
              disabled={isLoading}
            />
            <span className="ml-3 text-base text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-base text-[#2C8E5D] hover:text-[#245A47] font-medium transition-colors"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-base text-gray-600">
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchToSignUp}
            className="text-[#2C8E5D] hover:text-[#245A47] font-semibold transition-colors"
            disabled={isLoading}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
