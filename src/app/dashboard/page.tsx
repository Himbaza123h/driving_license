"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faClipboardCheck, faHistory, faCog } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
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

  const dashboardCards = [
    {
      title: 'Apply for License',
      description: 'Start a new driving license application',
      icon: faIdCard,
      color: 'bg-blue-500',
      href: '/apply'
    },
    {
      title: 'Verify License',
      description: 'Verify an existing driving license',
      icon: faClipboardCheck,
      color: 'bg-green-500',
      href: '/verify'
    },
    {
      title: 'Application History',
      description: 'View your previous applications',
      icon: faHistory,
      color: 'bg-purple-500',
      href: '/history'
    },
    {
      title: 'Account Settings',
      description: 'Manage your account preferences',
      icon: faCog,
      color: 'bg-gray-500',
      href: '/settings'
    }
  ];  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#2C8E5D] rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-inter font-bold text-gray-900">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600 font-inter">{user.email}</p>
              <div className="flex items-center mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {user.provider === 'google' ? 'Google Account' : 'Email Account'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(card.href)}
            >
              <div className="flex items-start space-x-4">
                <div className={`${card.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <FontAwesomeIcon icon={card.icon} className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-inter font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 font-inter text-sm">
                    {card.description}
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-inter font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-inter font-medium text-gray-900">Account created</p>
                <p className="font-inter text-sm text-gray-500">Welcome to DLV Burundi!</p>              </div>
              <span className="font-inter text-sm text-gray-400">Just now</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="font-inter text-sm text-gray-500">
              Start using the services above to see more activity here.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
