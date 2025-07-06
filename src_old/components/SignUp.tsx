"use client";
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

interface SignUpProps {
  onSwitchToSignIn: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitchToSignIn }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { signUp, signInWithGoogle, isLoading } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      await signUp(formData.email, formData.password, formData.name);
    } catch {
      setError('Failed to create account. Please try again.');
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign-up failed');
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length < 6) return { strength: 'weak', color: 'red' };
    if (password.length < 8) return { strength: 'medium', color: 'yellow' };
    return { strength: 'strong', color: 'green' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-inter font-bold text-gray-900 mb-2">
          Create your account
        </h2>
        <p className="text-gray-600 font-inter">
          Join DLV Burundi to access digital license services
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500"
            placeholder="Enter your full name"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
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
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500"
              placeholder="Create a password"
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
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.color === 'red' ? 'bg-red-500 w-1/3' :
                      passwordStrength.color === 'yellow' ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-full'
                    }`}
                  />
                </div>
                <span className={`text-sm font-medium capitalize ${
                  passwordStrength.color === 'red' ? 'text-red-600' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {passwordStrength.strength}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500"
              placeholder="Confirm your password"
              disabled={isLoading}
            /><button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isLoading}
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="w-5 h-5" />
            </button>
          </div>
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <div className="mt-2 flex items-center text-green-600">
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
              <span className="text-sm">Passwords match</span>
            </div>
          )}
        </div>

        <div className="flex items-start">
          <input
            id="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="w-4 h-4 text-[#2C8E5D] border-gray-300 rounded focus:ring-[#2C8E5D] mt-1"
            disabled={isLoading}
          />
          <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-600 font-inter">
            I agree to the{' '}
            <a href="#" className="text-[#2C8E5D] hover:text-[#245A47] font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-[#2C8E5D] hover:text-[#245A47] font-medium">
              Privacy Policy
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
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
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500" />
          <span>Sign up with Google</span>
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600 font-inter">
          Already have an account?{' '}
          <button
            onClick={onSwitchToSignIn}
            className="text-[#2C8E5D] hover:text-[#245A47] font-medium"
            disabled={isLoading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
