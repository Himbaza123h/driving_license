"use client";
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";

interface SignInProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword?: () => void;
}

const SignIn: React.FC<SignInProps> = ({
  onSwitchToSignUp,
  onSwitchToForgotPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Clear any previous errors
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting to sign in...'); // Debug log
      await signIn(email, password);
      console.log("Login successful"); // Debug log
      // If successful, the user will be redirected by the auth context
    } catch (error) {
      console.log("Login error in component:", error); // Debug log
      
      // Always set loading to false on error
      setIsLoading(false);
      
      // Handle different types of errors
      if (error instanceof Error) {
        console.log('Setting error message:', error.message); // Debug log
        setError(error.message);
      } else {
        console.log('Setting generic error message'); // Debug log
        setError("An unexpected error occurred. Please try again.");
      }
    }
    // Note: We don't set isLoading to false here on success because
    // the user will be redirected, so we want to keep the loading state
  };

  const handleForgotPassword = () => {
    if (onSwitchToForgotPassword) {
      onSwitchToForgotPassword();
    } else {
      // If no handler provided, you could navigate to a forgot password page
      // or show a modal/form inline
      alert("Please provide an email to reset your password");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-inter font-bold text-gray-900 mb-2">
          Welcome back
        </h2>
        <p className="text-gray-600 font-inter">
          Sign in to your DLV Burundi account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500"
            placeholder="Enter your email"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500"
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isLoading}
              title={showPassword ? "Hide password" : "Show password"}
            >
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-[#2C8E5D] border-gray-300 rounded focus:ring-[#2C8E5D]"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-600 font-inter">
              Remember me
            </span>
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-[#2C8E5D] hover:text-[#245A47] font-medium font-inter"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon
                icon={faSpinner}
                className="w-5 h-5 animate-spin"
              />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 font-inter">
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchToSignUp}
            className="text-[#2C8E5D] hover:text-[#245A47] font-medium"
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