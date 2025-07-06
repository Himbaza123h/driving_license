'use client';

import React from 'react';
import NationalIdAuth from '@/components/NationalIdAuth';
import { type CitizenData } from '@/services/supabaseAuth';

export default function DebugAuthPage() {
  const handleSuccess = (userData: CitizenData) => {
    console.log('SUCCESS:', userData);
  };

  const handleBack = () => {
    console.log('BACK clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Debug: National ID Auth</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <NationalIdAuth 
            onSuccess={handleSuccess}
            onBack={handleBack}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}
