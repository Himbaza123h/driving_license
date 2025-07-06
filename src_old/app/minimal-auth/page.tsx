"use client";
import React, { useState } from 'react';

export default function MinimalAuthTest() {
  const [step, setStep] = useState(1);
  const [nationalId, setNationalId] = useState('1198700123456');
  const [transactionId, setTransactionId] = useState('');
  const [otp, setOtp] = useState('123456');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  const API_BASE = 'http://localhost:8090/api';
  
  const handleStep1 = async () => {
    setLoading(true);
    setResult('Starting step 1...');
    
    try {
      const response = await fetch(`${API_BASE}/auth/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId })
      });
      
      const data = await response.json();
      setResult(`Step 1 result: ${JSON.stringify(data)}`);
      
      if (data.success && data.transactionId) {
        setTransactionId(data.transactionId);
        setStep(2);
      }
    } catch (error) {
      setResult(`Step 1 error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStep2 = async () => {
    setLoading(true);
    setResult('Starting step 2...');
    
    try {
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });
      
      const data = await response.json();
      setResult(`Step 2 result: ${JSON.stringify(data)}`);
      
      if (data.success) {
        setStep(3);
      }
    } catch (error) {
      setResult(`Step 2 error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStep3 = async () => {
    setLoading(true);
    setResult('Starting step 3...');
    
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, otp })
      });
      
      const data = await response.json();
      setResult(`Step 3 result: ${JSON.stringify(data)}`);
      
      if (data.success) {
        setResult(`SUCCESS! User data: ${JSON.stringify(data.userData)}`);
      }
    } catch (error) {
      setResult(`Step 3 error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Minimal Auth Test</h1>
      
      <div className="mb-4">
        <p>Current Step: {step}</p>
        <p>Loading: {loading ? 'YES' : 'NO'}</p>
      </div>
      
      {step === 1 && (
        <div className="mb-4">
          <input
            type="text"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="National ID"
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <button
            onClick={handleStep1}
            disabled={loading}
            className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Step 1: Initiate Auth'}
          </button>
        </div>
      )}
      
      {step === 2 && (
        <div className="mb-4">
          <p className="mb-2">Transaction ID: {transactionId}</p>
          <button
            onClick={handleStep2}
            disabled={loading}
            className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Step 2: Send OTP'}
          </button>
        </div>
      )}
      
      {step === 3 && (
        <div className="mb-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="OTP"
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <button
            onClick={handleStep3}
            disabled={loading}
            className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Step 3: Verify OTP'}
          </button>
        </div>
      )}
      
      <div className="mb-4">
        <button
          onClick={() => { setStep(1); setResult(''); setTransactionId(''); }}
          className="w-full p-2 bg-gray-500 text-white rounded"
        >
          Reset
        </button>
      </div>
      
      <div className="p-3 bg-gray-100 rounded text-sm">
        <h3 className="font-bold mb-2">Result:</h3>
        <pre className="whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  );
}
