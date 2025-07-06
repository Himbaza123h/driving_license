"use client";
import { useState } from 'react';

export default function DemoInstructions() {
  const [showInstructions, setShowInstructions] = useState(false);

  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_IS_DEMO) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-800">
          🧪 Demo Environment - Test Instructions
        </h3>
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-blue-600 hover:text-blue-800"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>
      
      {showInstructions && (
        <div className="mt-4 space-y-3 text-blue-700">
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold">Test National ID:</h4>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">1223334565757775</code>
            <p className="text-sm mt-1">Use this 16-digit ID for testing</p>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold">Test OTP:</h4>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">123456</code>
            <p className="text-sm mt-1">Always use this 6-digit code</p>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold">Demo User Profile:</h4>
            <p className="text-sm">Name: Jean Baptiste Ndayisenga</p>
            <p className="text-sm">Location: Bujumbura, Burundi</p>
            <p className="text-sm">Phone: +257 79 123 456</p>
          </div>
          
          <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
            <p className="text-sm">
              <strong>Note:</strong> This is mock data for demonstration purposes only. 
              Real government integration requires official API access.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
