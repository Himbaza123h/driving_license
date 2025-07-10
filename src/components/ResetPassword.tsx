"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ResetPasswordProps {
  onSwitchToSignIn: () => void;
  accessToken?: string;
  refreshToken?: string;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ 
  onSwitchToSignIn, 
  accessToken = "", 
  refreshToken = "" 
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const { resetPassword } = useAuth();

  useEffect(() => {
    // Check if tokens are provided (usually from URL params)
    if (!accessToken || !refreshToken) {
      setTokenError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [accessToken, refreshToken]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecial) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirmPassword) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const passwordValidation = validatePassword(trimmedPassword);
    if (passwordValidation) {
      setError(passwordValidation);
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(trimmedPassword, accessToken, refreshToken);
      setIsSuccess(true);
      console.log("Password reset successful");
    } catch (error) {
      console.log("Reset password error:", error);
      setIsLoading(false);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      setError("");
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (error) {
      setError("");
    }
  };

  if (tokenError) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-lg text-gray-600">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800">
              {tokenError}
            </p>
          </div>

          <button
            onClick={onSwitchToSignIn}
            className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Password Reset Successful
          </h2>
          <p className="text-lg text-gray-600">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>

        <button
          onClick={onSwitchToSignIn}
          className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          Reset your password
        </h2>
        <p className="text-lg text-gray-600">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-lg text-base font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label
            htmlFor="password"
            className="block text-base font-semibold text-gray-700"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-5 py-4 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-base"
              placeholder="Enter your new password"
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

        <div className="space-y-3">
          <label
            htmlFor="confirmPassword"
            className="block text-base font-semibold text-gray-700"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className="w-full px-5 py-4 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-base"
              placeholder="Confirm your new password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
              disabled={isLoading}
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-6 h-6" />
              ) : (
                <Eye className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Password requirements:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• At least 8 characters</li>
            <li>• One uppercase letter</li>
            <li>• One lowercase letter</li>
            <li>• One number</li>
            <li>• One special character</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Resetting password...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToSignIn}
          className="text-[#2C8E5D] hover:text-[#245A47] font-medium transition-colors"
          disabled={isLoading}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;