"use client";
import { getConfig } from '@/config/environment';

export default function EnvironmentBanner() {
  const config = getConfig();
  
  // Only show banner in non-production environments
  if (process.env.NODE_ENV === 'production' && !config.IS_MOCK) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-black text-center py-2 px-4 font-semibold text-sm">
      ⚠️ {config.ENVIRONMENT_LABEL || 'DEMO ENVIRONMENT'} - This is a testing system using mock data. 
      Not connected to real government databases.
    </div>
  );
}
