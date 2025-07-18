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
  faSearch,
  faFilter,
  faRefresh,
  faCheck,
  faTimes,
  faUsers,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

// Type definitions
interface Application {
  id: string;
  citizenId: string;
  licenseType: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  reviewNotes?: string;
  personalInfo?: {
    firstName: string;
    lastName: string;
    nationalId: string;
    email: string;
    phone: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: Application[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

type ApplicationStatus = 'APPROVED' | 'REJECTED' | 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'DRAFT' | 'CANCELLED';

const AdminApplicationsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [processingAction, setProcessingAction] = useState<string>('');

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchApplications();
    }
  }, [isAdmin, currentPage, statusFilter]);

  const fetchApplications = async (): Promise<void> => {
    setLoadingApplications(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter
      });

      const response = await fetch(`/api/admin/applications?${params}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setApplications(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
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

  const handleApproveReject = async (applicationId: string, action: 'approve' | 'reject', reviewNotes?: string): Promise<void> => {
    setProcessingAction(applicationId);
    
    try {
      const response = await fetch('/api/admin/applications/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewNotes,
          adminId: user?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the application in the local state
        setApplications(prev => prev.map(app => 
          app.id === applicationId ? { ...app, ...data.data } : app
        ));
        setSelectedApplications(prev => prev.filter(id => id !== applicationId));
      } else {
        setError(data.error || `Failed to ${action} application`);
      }
    } catch (err) {
      console.error(`Error ${action}ing application:`, err);
      setError(`Network error. Failed to ${action} application.`);
    } finally {
      setProcessingAction('');
    }
  };

  const handleBatchAction = async (action: 'approve' | 'reject', reviewNotes?: string): Promise<void> => {
    if (selectedApplications.length === 0) return;

    setProcessingAction('batch');
    
    try {
      const response = await fetch('/api/admin/applications/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationIds: selectedApplications,
          action: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewNotes,
          adminId: user?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the applications list
        await fetchApplications();
        setSelectedApplications([]);
      } else {
        setError(data.error || `Failed to ${action} applications`);
      }
    } catch (err) {
      console.error(`Error ${action}ing applications:`, err);
      setError(`Network error. Failed to ${action} applications.`);
    } finally {
      setProcessingAction('');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toUpperCase() as ApplicationStatus) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-purple-100 text-purple-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase() as ApplicationStatus) {
      case 'APPROVED':
        return faCheckCircle;
      case 'REJECTED':
      case 'CANCELLED':
        return faTimesCircle;
      case 'PENDING':
      case 'SUBMITTED':
        return faClock;
      case 'UNDER_REVIEW':
        return faExclamationTriangle;
      case 'DRAFT':
        return faFileAlt;
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
        return 'Private Car (Class B)';
      case 'motorcycle':
        return 'Motorcycle (Class A)';
      case 'commercial':
        return 'Commercial (Class C)';
      case 'category_a':
        return 'Category A';
      case 'category_b':
        return 'Category B';
      case 'category_c':
        return 'Category C';
      case 'category_d':
        return 'Category D';
      default:
        return type?.replace('_', ' ').toUpperCase() || 'Unknown';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.personalInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personalInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personalInfo?.nationalId?.includes(searchTerm) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleViewApplication = (applicationId: string) => {
    router.push(`/application/${applicationId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  // If user is not authenticated or not admin, redirect
  if (!user || !isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-inter font-bold text-gray-900">Manage Applications</h1>
                <p className="text-gray-600 font-inter mt-2">
                  Review and manage all license applications
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 border border-gray-200">
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-500" />
                  <span className="font-inter text-sm text-gray-700">
                    {pagination.total} Total Applications
                  </span>
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
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or application ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent font-inter"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent font-inter"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Batch Actions */}
              {selectedApplications.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-inter text-sm text-gray-600">
                    {selectedApplications.length} selected
                  </span>
                  <button
                    onClick={() => handleBatchAction('approve')}
                    disabled={processingAction === 'batch'}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-inter font-medium text-sm"
                  >
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                    <span>Approve All</span>
                  </button>
                  <button
                    onClick={() => handleBatchAction('reject')}
                    disabled={processingAction === 'batch'}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-inter font-medium text-sm"
                  >
                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                    <span>Reject All</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-inter">{error}</p>
            </div>
          )}

          {/* Applications Table */}
          {loadingApplications ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C8E5D] mx-auto"></div>
                <p className="mt-4 text-gray-600 font-inter">Loading applications...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedApplications(filteredApplications.map(app => app.id));
                              } else {
                                setSelectedApplications([]);
                              }
                            }}
                            className="w-4 h-4 text-[#2C8E5D] focus:ring-[#2C8E5D] border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          License Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-inter">
                            {searchTerm ? 'No applications found matching your search.' : 'No applications found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((application) => (
                          <tr key={application.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedApplications.includes(application.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedApplications(prev => [...prev, application.id]);
                                  } else {
                                    setSelectedApplications(prev => prev.filter(id => id !== application.id));
                                  }
                                }}
                                className="w-4 h-4 text-[#2C8E5D] focus:ring-[#2C8E5D] border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 font-inter">
                                    {application.personalInfo?.firstName} {application.personalInfo?.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500 font-inter">
                                    ID: {application.personalInfo?.nationalId || 'N/A'}
                                  </div>
                                  <div className="text-sm text-gray-500 font-inter">
                                    {application.personalInfo?.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-inter">
                                {getLicenseTypeLabel(application.licenseType)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusColor(application.status)}`}>
                                <FontAwesomeIcon 
                                  icon={getStatusIcon(application.status)} 
                                  className="w-3 h-3 mr-1" 
                                />
                                {application.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-inter">
                              {formatDate(application.submittedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewApplication(application.id)}
                                  className="text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium"
                                >
                                  <FontAwesomeIcon icon={faEye} className="w-4 h-4 mr-1" />
                                  View
                                </button>
                                
                                {application.status !== 'APPROVED' && application.status !== 'REJECTED' && application.status !== 'CANCELLED' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveReject(application.id, 'approve')}
                                      disabled={processingAction === application.id}
                                      className="text-green-600 hover:text-green-700 disabled:text-gray-400 font-inter font-medium"
                                    >
                                      <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-1" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleApproveReject(application.id, 'reject')}
                                      disabled={processingAction === application.id}
                                      className="text-red-600 hover:text-red-700 disabled:text-gray-400 font-inter font-medium"
                                    >
                                      <FontAwesomeIcon icon={faTimes} className="w-4 h-4 mr-1" />
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 font-inter">
                        Showing{' '}
                        <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium font-inter ${
                              page === currentPage
                                ? 'z-10 bg-[#2C8E5D] border-[#2C8E5D] text-white'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApplicationsPage;