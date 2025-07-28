"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCheckCircle, faTimesCircle, faEnvelope } from "@fortawesome/free-solid-svg-icons";

const VerifyEmailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token || !userId) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    verifyEmail(token, userId);
  }, [searchParams]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      router.push('/auth');
    }
  }, [status, countdown, router]);

  const verifyEmail = async (token, userId) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userId }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Email verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    const userId = searchParams.get('userId');
    if (!userId) return;

    try {
      // You'll need to implement this endpoint to resend verification email
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      console.error('Resend error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <FontAwesomeIcon 
              icon={faEnvelope} 
              className="text-4xl text-[#2C8E5D] mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verification
            </h1>
          </div>

          {status === 'verifying' && (
            <div className="space-y-4">
              <FontAwesomeIcon 
                icon={faSpinner} 
                className="text-3xl text-[#2C8E5D] animate-spin"
              />
              <p className="text-gray-600">
                Verifying your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <FontAwesomeIcon 
                icon={faCheckCircle} 
                className="text-4xl text-green-500"
              />
              <div>
                <h2 className="text-xl font-semibold text-green-600 mb-2">
                  Verification Successful!
                </h2>
                <p className="text-gray-600 mb-4">
                  {message}
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to login page in {countdown} seconds...
                </p>
              </div>
              <button
                onClick={() => router.push('/auth')}
                className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
              >
                Continue to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <FontAwesomeIcon 
                icon={faTimesCircle} 
                className="text-4xl text-red-500"
              />
              <div>
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Verification Failed
                </h2>
                <p className="text-gray-600 mb-4">
                  {message}
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Resend Verification Email
                </button>
                <button
                  onClick={() => router.push('/auth')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;