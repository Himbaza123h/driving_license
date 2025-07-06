"use client";
import React from 'react';
import { supabaseConfig, validateEnvironment } from '@/config/environment';

export default function EnvironmentDebugPage() {
  const [envStatus, setEnvStatus] = React.useState<{
    valid: boolean;
    error?: string;
    config?: {
      url: string;
      anonKeyPresent: boolean;
      anonKeyPrefix: string;
      serviceRoleKeyPresent: boolean;
      serviceRoleKeyPrefix: string;
      nodeEnv: string | undefined;
      environment: string;
    };
  }>({ valid: false });

  React.useEffect(() => {
    try {
      validateEnvironment();
      setEnvStatus({
        valid: true,
        config: {
          url: supabaseConfig.url,
          anonKeyPresent: !!supabaseConfig.anonKey,
          anonKeyPrefix: supabaseConfig.anonKey?.substring(0, 20) + '...',
          serviceRoleKeyPresent: !!supabaseConfig.serviceRoleKey,
          serviceRoleKeyPrefix: supabaseConfig.serviceRoleKey?.substring(0, 20) + '...',
          nodeEnv: process.env.NODE_ENV,
          environment: typeof window !== 'undefined' ? 'client' : 'server'
        }
      });
    } catch (error) {
      setEnvStatus({
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Environment Configuration Debug</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables Status</h2>
          
          {envStatus.valid ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-medium text-green-800">Environment Valid</span>
              </div>
              <pre className="bg-green-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(envStatus.config, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="font-medium text-red-800">Environment Invalid</span>
              </div>
              <p className="text-red-700">Error: {envStatus.error}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Environment Variables</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify({
              NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined',
              NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined',
              NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 
                `${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'undefined',
              NODE_ENV: process.env.NODE_ENV,
            }, null, 2)}
          </pre>
        </div>

        <div className="mt-6">
          <a 
            href="/auth" 
            className="bg-[#2C8E5D] text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Auth Page
          </a>
        </div>
      </div>
    </div>
  );
}
