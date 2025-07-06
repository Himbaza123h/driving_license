"use client";
import React, { useState } from 'react';

export default function SimpleAuthTest() {
  const [nationalId, setNationalId] = useState('1198700123456');
  const [otp, setOtp] = useState('123456');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8090/api';
  
  const initiateAuth = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      console.log('Initiating auth with ID:', nationalId);
      console.log('API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/auth/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nationalId })
      });
      
      const data = await response.json();
      console.log('Auth response:', data);
      
      if (data.success && data.transactionId) {
        setTransactionId(data.transactionId);
        setResult(JSON.stringify(data, null, 2));
      } else {
        setError('Auth failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  const sendOtp = async () => {
    if (!transactionId) {
      setError('No transaction ID. Run step 1 first.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      console.log('Sending OTP for transaction:', transactionId);
      
      const response = await fetch(`${apiUrl}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId })
      });
      
      const data = await response.json();
      console.log('OTP response:', data);
      
      if (data.success) {
        setResult(JSON.stringify(data, null, 2));
      } else {
        setError('OTP failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('OTP error:', err);
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  const verifyOtp = async () => {
    if (!transactionId) {
      setError('No transaction ID. Run step 1 first.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      console.log('Verifying OTP:', { transactionId, otp });
      
      const response = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId, otp })
      });
      
      const data = await response.json();
      console.log('Verify response:', data);
      
      if (data.success) {
        setResult(JSON.stringify(data, null, 2));
      } else {
        setError('Verification failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold mb-4">Simple Auth Test</h1>
        
        <div className="mb-6">
          <p className="text-gray-500 text-sm">API URL: {apiUrl}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-medium mb-2">Step 1: Initiate Auth</h2>
            <div className="flex mb-2">
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="National ID"
                className="flex-1 border border-gray-300 rounded-l p-2"
              />
              <button
                onClick={initiateAuth}
                disabled={loading}
                className="bg-blue-500 text-white rounded-r px-4 py-2 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Initiate'}
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="font-medium mb-2">Step 2: Send OTP</h2>
            <div className="flex mb-2">
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Transaction ID"
                className="flex-1 border border-gray-300 rounded-l p-2"
              />
              <button
                onClick={sendOtp}
                disabled={loading || !transactionId}
                className="bg-blue-500 text-white rounded-r px-4 py-2 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Send OTP'}
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="font-medium mb-2">Step 3: Verify OTP</h2>
            <div className="flex mb-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="OTP"
                className="flex-1 border border-gray-300 rounded-l p-2"
              />
              <button
                onClick={verifyOtp}
                disabled={loading || !transactionId}
                className="bg-blue-500 text-white rounded-r px-4 py-2 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}
        
        {result && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Result:</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
