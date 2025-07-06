'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { eSignetService } from '@/services/eSignetService';

interface AuthResult {
  success?: boolean;
  message?: string;
  userData?: {
    nationalId: string;
    fullName: string;
    dateOfBirth: string;
    address: string;
    phoneNumber: string;
    email?: string;
  };
  transactionId?: string;
  error?: string;
}

export default function TestConnectionPage() {
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean;
    message?: string;
    error?: string;
  }>({ connected: false });
  
  const [testAuthResult, setTestAuthResult] = useState<AuthResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8090/api/health');
      const data = await response.json();
      
      if (response.ok) {
        setBackendStatus({
          connected: true,
          message: `Backend is healthy! Service: ${data.service}, Version: ${data.version}`
        });
      } else {
        setBackendStatus({
          connected: false,
          error: 'Backend responded with an error'
        });
      }
    } catch (error) {
      setBackendStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  };

  const testAuthenticationFlow = async () => {
    setLoading(true);
    setTestAuthResult(null);

    try {
      console.log('🔄 Testing authentication flow...');
      
      // Step 1: Initiate authentication
      const authResult = await eSignetService.initiateAuth('1198700123456');
      console.log('Auth initiate result:', authResult);
      
      if (!authResult.success) {
        setTestAuthResult({
          success: false,
          message: authResult.message,
          error: 'Authentication initiation failed'
        });
        return;
      }

      // Step 2: Send OTP
      const otpResult = await eSignetService.sendOtp({
        nationalId: '1198700123456',
        transactionId: authResult.transactionId!
      });
      console.log('OTP send result:', otpResult);

      if (!otpResult.success) {
        setTestAuthResult({
          success: false,
          message: otpResult.message,
          error: 'OTP sending failed'
        });
        return;
      }

      // Step 3: Verify OTP
      const verifyResult = await eSignetService.verifyOtp({
        nationalId: '1198700123456',
        otp: '123456',
        transactionId: otpResult.transactionId!
      });
      console.log('OTP verify result:', verifyResult);

      setTestAuthResult(verifyResult);

    } catch (error) {
      console.error('Authentication test error:', error);
      setTestAuthResult({
        success: false,
        message: 'Authentication test failed',
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔧 Backend Connection Test
          </h1>

          {/* Backend Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Backend Health Status</h2>
            <div className={`p-4 rounded-lg border ${
              backendStatus.connected 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  backendStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`font-medium ${
                  backendStatus.connected ? 'text-green-800' : 'text-red-800'
                }`}>
                  {backendStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {backendStatus.message && (
                <p className="text-green-700 text-sm">{backendStatus.message}</p>
              )}
              {backendStatus.error && (
                <p className="text-red-700 text-sm">{backendStatus.error}</p>
              )}
            </div>
          </div>

          {/* Authentication Test */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Authentication Flow Test</h2>
            <div className="space-y-4">
              <button
                onClick={testAuthenticationFlow}
                disabled={loading || !backendStatus.connected}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Testing...' : '🧪 Test Full Auth Flow'}
              </button>

              {testAuthResult && (
                <div className={`p-4 rounded-lg border ${
                  testAuthResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h3 className={`font-medium mb-2 ${
                    testAuthResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testAuthResult.success ? '✅ Authentication Successful' : '❌ Authentication Failed'}
                  </h3>
                  <p className={`text-sm mb-2 ${
                    testAuthResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testAuthResult.message}
                  </p>
                  {testAuthResult.userData && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border">
                      <h4 className="font-medium text-gray-800 mb-2">User Data:</h4>
                      <pre className="text-xs text-gray-600">
                        {JSON.stringify(testAuthResult.userData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {testAuthResult.error && (
                    <p className="text-red-600 text-sm mt-2">Error: {testAuthResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">📋 Test Instructions</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Make sure the backend server is running on port 8090</li>
              <li>• The test uses National ID: 1198700123456</li>
              <li>• The test uses OTP: 123456</li>
              <li>• Check browser console for detailed logs</li>
              <li>• Check backend terminal for API request logs</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <Link
              href="/"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700"
            >
              ← Back to Home
            </Link>
            <Link
              href="/auth"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
            >
              Try Authentication
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
