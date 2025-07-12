'use client';

import { useState, useEffect, JSX } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Clock, User, Hash, Calendar, Shield, Loader2 } from 'lucide-react';

interface LicenseData {
  license_number: string;
  holder_name: string;
  national_id: string;
  license_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  created_at: string;
}

interface VerificationResponse {
  success: boolean;
  valid: boolean;
  expired: boolean;
  license: LicenseData;
  message: string;
}

interface ApiError {
  error: string;
  success: false;
  valid: false;
  details?: string;
}

type ApiResponse = VerificationResponse | ApiError;

export default function VerifyLicensePage(): JSX.Element {
  const params = useParams();
  const licenseNumber = params?.license as string;
  
  const [verificationData, setVerificationData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (licenseNumber) {
      verifyLicense(licenseNumber);
    }
  }, [licenseNumber]);

  const verifyLicense = async (license: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/verify/license?license=${encodeURIComponent(license)}`);
      const data: ApiResponse = await response.json();
      
      if (response.ok && data.success) {
        setVerificationData(data as VerificationResponse);
      } else {
        const errorData = data as ApiError;
        setError(errorData.error || 'Failed to verify license');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (): string => {
    if (!verificationData) return 'bg-gray-100';
    
    if (verificationData.valid) {
      return 'bg-green-50 border-green-200';
    } else if (verificationData.expired) {
      return 'bg-orange-50 border-orange-200';
    } else {
      return 'bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (): JSX.Element | null => {
    if (!verificationData) return null;
    
    if (verificationData.valid) {
      return <CheckCircle className="w-8 h-8 text-green-600" />;
    } else if (verificationData.expired) {
      return <AlertTriangle className="w-8 h-8 text-orange-600" />;
    } else {
      return <XCircle className="w-8 h-8 text-red-600" />;
    }
  };

  const getStatusText = (): string => {
    if (!verificationData) return '';
    
    if (verificationData.valid) {
      return 'Valid License';
    } else if (verificationData.expired) {
      return 'License Expired';
    } else {
      return 'Invalid License';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying License
          </h2>
          <p className="text-gray-600">
            Please wait while we verify the license information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => verifyLicense(licenseNumber)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            License Verification
          </h1>
          <p className="text-gray-600">
            Official license verification system
          </p>
        </div>

        {/* Verification Result Card */}
        <div className={`bg-white rounded-xl shadow-lg border-2 ${getStatusColor()} p-6 mb-6`}>
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getStatusText()}
            </h2>
            <p className="text-gray-600">
              {verificationData?.message || 'License verification completed'}
            </p>
          </div>

          {verificationData?.license && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Hash className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">License Number</span>
                  </div>
                  <p className="text-gray-700 font-mono text-sm">
                    {verificationData.license.license_number}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">License Holder</span>
                  </div>
                  <p className="text-gray-700">
                    {verificationData.license.holder_name}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">License Type</span>
                  </div>
                  <p className="text-gray-700 capitalize">
                    {verificationData.license.license_type}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Hash className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">National ID</span>
                  </div>
                  <p className="text-gray-700 font-mono text-sm">
                    {verificationData.license.national_id}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">Issue Date</span>
                  </div>
                  <p className="text-gray-700">
                    {formatDate(verificationData.license.issue_date)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">Expiry Date</span>
                  </div>
                  <p className={`font-medium ${
                    verificationData.expired ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    {formatDate(verificationData.license.expiry_date)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="font-medium text-gray-900">Status</span>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusBadgeClass(verificationData.license.status)
                }`}>
                  {verificationData.license.status || 'Unknown'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verification Information
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            This verification was performed on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-gray-500 text-xs">
            For questions about this license, please contact the issuing authority.
          </p>
        </div>
      </div>
    </div>
  );
}