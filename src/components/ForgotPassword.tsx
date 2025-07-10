"use client";
import React, { useState } from "react";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ForgotPasswordProps {
  onSwitchToSignIn: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToSignIn }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { forgotPassword } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(trimmedEmail);
      setIsSuccess(true);
      console.log("Password reset email sent successfully");
    } catch (error) {
      console.log("Forgot password error:", error);
      setIsLoading(false);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError("");
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-lg text-gray-600">
            We have sent a password reset link to:
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-2">
            {email}
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Check your email
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Click the link in the email to reset your password. If you do not see it, check your spam folder.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Did not receive the email?
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                setIsLoading(false);
                setError("");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              Try again
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onSwitchToSignIn}
            className="inline-flex items-center text-[#2C8E5D] hover:text-[#245A47] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          Forgot your password?
        </h2>
        <p className="text-lg text-gray-600">
          Enter your email address and we will send you a link to reset your password.
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
            htmlFor="email"
            className="block text-base font-semibold text-gray-700"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-base"
            placeholder="Enter your email address"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Sending reset link...</span>
            </>
          ) : (
            <span>Send reset link</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToSignIn}
          className="inline-flex items-center text-[#2C8E5D] hover:text-[#245A47] font-medium transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;