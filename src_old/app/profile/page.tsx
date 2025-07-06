"use client";
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faKey, faShield, faEdit, faSave, faTimes, faCarSide, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const ProfilePage: React.FC = () => {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email
      });
    }
  }, [user]);
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C8E5D] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-inter">Loading...</p>
        </div>
      </div>
    );
  }
  // If user is not authenticated, let ConditionalLayout handle the redirect
  if (!user) {
    return null;
  }

  const handleSave = () => {
    // In a real app, this would update the user data via API
    console.log('Saving profile data:', formData);
    setIsEditing(false);
    // Show success message here
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email
    });
    setIsEditing(false);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#2C8E5D] to-[#1f6a44] rounded-lg p-1.5 shadow-sm">
                <FontAwesomeIcon icon={faCarSide} className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="font-inter font-bold text-lg text-black">DLV Burundi</h1>
                <p className="font-inter text-xs text-gray-600">Profile</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="font-inter text-sm text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-all"
              >
                <span className="font-inter text-sm text-gray-700">Dashboard</span>
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

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-inter font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 font-inter mt-2">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-inter font-semibold text-gray-900">
                  Personal Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium"
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 bg-[#2C8E5D] hover:bg-[#245A47] text-white px-4 py-2 rounded-lg font-inter font-medium"
                    >
                      <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-inter font-medium"
                    >
                      <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-[#2C8E5D] rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="font-inter font-medium text-gray-900">Profile Picture</h3>
                    <p className="font-inter text-sm text-gray-500 mb-2">
                      Upload a photo to personalize your account
                    </p>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-inter text-sm font-medium">
                      Upload Photo
                    </button>
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent font-inter"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gray-400" />
                      <span className="font-inter text-gray-900">{user.name}</span>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent font-inter"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-gray-400" />
                      <span className="font-inter text-gray-900">{user.email}</span>
                    </div>
                  )}
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={faShield} className="w-5 h-5 text-gray-400" />
                    <span className="font-inter text-gray-900 capitalize">
                      {user.provider === 'google' ? 'Google Account' : 'Email Account'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-inter font-semibold text-gray-900 mb-6">
                Security Settings
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faKey} className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-inter font-medium text-gray-900">Password</h3>
                      <p className="font-inter text-sm text-gray-500">
                        Last updated 30 days ago
                      </p>
                    </div>
                  </div>
                  <button className="text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium">
                    Change
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faShield} className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-inter font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="font-inter text-sm text-gray-500">
                        Add an extra layer of security
                      </p>
                    </div>
                  </div>
                  <button className="bg-[#2C8E5D] hover:bg-[#245A47] text-white px-4 py-2 rounded-lg font-inter font-medium">
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-inter font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="font-inter text-gray-700">Dashboard</span>
                </button>
                <button
                  onClick={() => router.push('/apply')}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="font-inter text-gray-700">Apply for License</span>
                </button>
                <button
                  onClick={() => router.push('/verify')}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="font-inter text-gray-700">Verify License</span>
                </button>
              </div>
            </div>            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-inter font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="font-inter text-sm text-blue-700 mb-4">
                Contact our support team if you have any questions about your account.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-inter font-medium text-sm">
                Contact Support
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
