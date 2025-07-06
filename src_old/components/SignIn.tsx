"use client";
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSpinner, faIdCard } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

interface SignInProps {
  onSwitchToSignUp: () => void;
  onSwitchToNationalId?: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSwitchToSignUp, onSwitchToNationalId }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInWithGoogle, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await signIn(email, password);
    } catch {
      setError('Invalid email or password');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign-in failed');
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500"
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500"
              placeholder="Enter your password"
              disabled={isLoading}
            /><button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isLoading}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-[#2C8E5D] border-gray-300 rounded focus:ring-[#2C8E5D]"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-600 font-inter">Remember me</span>
          </label>
          <a href="#" className="text-sm text-[#2C8E5D] hover:text-[#245A47] font-medium font-inter">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-inter">Or continue with</span>
          </div>
        </div>        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500" />
          <span>Sign in with Google</span>
        </button>

        {onSwitchToNationalId && (
          <button
            onClick={onSwitchToNationalId}
            disabled={isLoading}
            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            <FontAwesomeIcon icon={faIdCard} className="w-5 h-5" />
            <span>Verify with National ID</span>
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600 font-inter">
          Don&apos;t have an account?{' '}
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
