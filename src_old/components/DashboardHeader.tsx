"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faCarSide } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

const DashboardHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#2C8E5D] to-[#1f6a44] rounded-lg p-1.5 shadow-sm">
              <FontAwesomeIcon icon={faCarSide} className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="font-inter font-bold text-lg text-black">DLV Burundi</h1>
              <p className="font-inter text-xs text-gray-600">Dashboard</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="font-inter text-sm text-gray-700">Welcome, {user.name}</span>
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-all"
            >
              <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-600" />
              <span className="font-inter text-sm text-gray-700">Profile</span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition-all"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
              <span className="font-inter text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
