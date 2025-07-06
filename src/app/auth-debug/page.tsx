"use client";
import React, { useState, useEffect } from 'react';
import { eSignetService, type NationalIdData } from '@/services/eSignetService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

export default function AuthDebugPage() {
  const [nationalId, setNationalId] = useState('1198700123456'); // Default test ID
  const [transactionId, setTransactionId] = useState('');
  const [otp, setOtp] = useState('123456'); // Default test OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [userData, setUserData] = useState<NationalIdData | null>(null);
  const [backendUrl, setBackendUrl] = useState('');
  
  // Get current backend URL from environment
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8090/api';
    setBackendUrl(url);
  }, []);

  // Helper to format JSON responses
  const formatResponse = (data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // Initiate authentication
  const handleInitiateAuth = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setApiResponse('');
    
    try {
      const result = await eSignetService.initiateAuth(nationalId);
      setApiResponse(formatResponse(result));
      
      if (result.success && result.transactionId) {
        setSuccess('Authentication initiated successfully');
        setTransactionId(result.transactionId);
      } else {
        setError(result.message || 'Failed to initiate authentication');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!transactionId) {
      setError('Transaction ID is required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setApiResponse('');
    
    try {
      const result = await eSignetService.sendOtp({
        nationalId,
        transactionId
      });
      setApiResponse(formatResponse(result));
      
      if (result.success) {
        setSuccess('OTP sent successfully');
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!transactionId || !otp) {
      setError('Transaction ID and OTP are required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setApiResponse('');
    setUserData(null);
    
    try {
      const result = await eSignetService.verifyOtp({
        nationalId,
        transactionId,
        otp
      });
      setApiResponse(formatResponse(result));
      
      if (result.success && result.userData) {
        setSuccess('OTP verified successfully');
        setUserData(result.userData);
      } else {
        setError(result.message || 'Failed to verify OTP');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Check backend health
  const checkBackendHealth = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setApiResponse('');
    
    try {
      const response = await fetch(`${backendUrl}/health`);
      const data = await response.json();
      setApiResponse(formatResponse(data));
      
      if (data.status === 'healthy') {
        setSuccess('Backend is healthy');
      } else {
        setError('Backend health check failed');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">National ID Authentication Debugger</h1>
        
        {/* Environment Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-medium mb-2">Environment</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Backend URL:</strong> {backendUrl}</div>
            <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
            <button 
              onClick={checkBackendHealth}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
            >
              Check Backend Health
            </button>
          </div>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}
        
        {/* Step 1: Initiate Auth */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-medium mb-3">Step 1: Initiate Authentication</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter National ID"
              />
              <button
                onClick={handleInitiateAuth}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                ) : (
                  'Initiate Auth'
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Step 2: Send OTP */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-medium mb-3">Step 2: Send OTP</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Transaction ID from Step 1"
              />
              <button
                onClick={handleSendOTP}
                disabled={loading || !transactionId}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Step 3: Verify OTP */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-medium mb-3">Step 3: Verify OTP</h2>
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            <strong>Development Mode:</strong> Any OTP will work for testing purposes
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OTP (any value works in dev mode)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter OTP"
              />
              <button
                onClick={handleVerifyOTP}
                disabled={loading || !transactionId || !otp}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                ) : (
                  'Verify OTP'
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* API Response */}
        {apiResponse && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-medium mb-3">API Response</h2>
            <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm">
              {apiResponse}
            </pre>
          </div>
        )}
        
        {/* User Data (if verified) */}
        {userData && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-medium mb-3">Verified User Data</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Name:</strong> {userData.fullName}
              </div>
              <div>
                <strong>National ID:</strong> {userData.nationalId}
              </div>
              <div>
                <strong>Date of Birth:</strong> {userData.dateOfBirth}
              </div>
              <div>
                <strong>Phone:</strong> {userData.phoneNumber}
              </div>
              <div>
                <strong>Email:</strong> {userData.email || 'N/A'}
              </div>
              <div>
                <strong>Address:</strong> {userData.address}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
