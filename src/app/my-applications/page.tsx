"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faEye, 
  faCheckCircle, 
  faTimesCircle, 
  faClock, 
  faExclamationTriangle,
  faDownload,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

// Type definitions
interface Application {
  id: string;
  licenseType: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  reviewNotes?: string;
}

interface ApiResponse {
  success: boolean;
  data: Application[];
  error?: string;
}

type LicenseType = 'car' | 'motorcycle' | 'commercial' | 'category_a' | 'category_b' | 'category_c' | 'category_d';
type ApplicationStatus = 'approved' | 'rejected' | 'pending' | 'submitted' | 'under_review';

const MyApplicationsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user?.nationalId) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async (): Promise<void> => {
    if (!user?.nationalId) return;

    setLoadingApplications(true);
    setError('');

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          citizenId: user.nationalId
        })
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setApplications(data.data);
      } else {
        setError(data.error || 'Failed to fetch applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoadingApplications(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase() as ApplicationStatus) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase() as ApplicationStatus) {
      case 'approved':
        return faCheckCircle;
      case 'rejected':
        return faTimesCircle;
      case 'pending':
      case 'submitted':
        return faClock;
      case 'under_review':
        return faExclamationTriangle;
      default:
        return faFileAlt;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLicenseTypeLabel = (type: string): string => {
    switch (type) {
      case 'car':
        return 'Private Car License (Class B)';
      case 'motorcycle':
        return 'Motorcycle License (Class A)';
      case 'commercial':
        return 'Commercial License (Class C)';
      case 'category_a':
        return 'Category A (Motorcycles)';
      case 'category_b':
        return 'Category B (Cars)';
      case 'category_c':
        return 'Category C (Trucks)';
      case 'category_d':
        return 'Category D (Buses)';
      default:
        return type?.replace('_', ' ').toUpperCase() || 'Unknown';
    }
  };

  const handleDownload = (applicationId: string): void => {
    // Handle license download
    console.log('Download license for:', applicationId);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-inter font-bold text-gray-900">My Applications</h1>
                <p className="text-gray-600 font-inter mt-2">
                  Track your driving license applications and their status
                </p>
              </div>
              <button
                onClick={fetchApplications}
                disabled={loadingApplications}
                className="flex items-center space-x-2 bg-[#2C8E5D] hover:bg-[#245A47] disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-inter font-medium"
              >
                <FontAwesomeIcon 
                  icon={faRefresh} 
                  className={`w-4 h-4 ${loadingApplications ? 'animate-spin' : ''}`} 
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-inter">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loadingApplications ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C8E5D] mx-auto"></div>
                <p className="mt-4 text-gray-600 font-inter">Loading applications...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Applications Grid */}
              {applications.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <FontAwesomeIcon icon={faFileAlt} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-inter font-semibold text-gray-900 mb-2">
                    No Applications Found
                  </h3>
                  <p className="text-gray-600 font-inter mb-6">
                    You haven&apos;t submitted any license applications yet.
                  </p>
                  <button
                    onClick={() => router.push('/apply')}
                    className="bg-[#2C8E5D] hover:bg-[#245A47] text-white px-6 py-2 rounded-lg font-inter font-medium"
                  >
                    Apply for License
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {applications.map((application: Application) => (
                    <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      {/* Application Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#2C8E5D] rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-inter font-semibold text-gray-900">
                              {getLicenseTypeLabel(application.licenseType)}
                            </h3>
                            <p className="font-inter text-sm text-gray-500">
                              ID: {application.id}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          <FontAwesomeIcon 
                            icon={getStatusIcon(application.status)} 
                            className="w-3 h-3 mr-1" 
                          />
                          {application.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Application Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className="font-inter text-sm text-gray-500">Submitted:</span>
                          <span className="font-inter text-sm text-gray-900">
                            {formatDate(application.submittedAt)}
                          </span>
                        </div>
                        
                        {application.approvedAt && (
                          <div className="flex justify-between">
                            <span className="font-inter text-sm text-gray-500">Approved:</span>
                            <span className="font-inter text-sm text-green-600">
                              {formatDate(application.approvedAt)}
                            </span>
                          </div>
                        )}
                        
                        {application.rejectedAt && (
                          <div className="flex justify-between">
                            <span className="font-inter text-sm text-gray-500">Rejected:</span>
                            <span className="font-inter text-sm text-red-600">
                              {formatDate(application.rejectedAt)}
                            </span>
                          </div>
                        )}

                        {application.reviewNotes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="font-inter text-sm text-gray-700">
                              <strong>Review Notes:</strong> {application.reviewNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/application/${application.id}`)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-inter font-medium text-sm"
                        >
                          <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        
                        {application.status === 'approved' && (
                          <button
                            onClick={() => handleDownload(application.id)}
                            className="flex items-center justify-center space-x-2 bg-[#2C8E5D] hover:bg-[#245A47] text-white px-4 py-2 rounded-lg font-inter font-medium text-sm"
                          >
                            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplicationsPage;