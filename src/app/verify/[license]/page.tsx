// Create this file: /verify/[license]/page.js

"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck,
  faExclamationTriangle,
  faTimes,
  faSpinner,
  faIdCard,
  faShield
} from '@fortawesome/free-solid-svg-icons';

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

interface VerificationResult {
  success: boolean;
  valid: boolean;
  expired: boolean;
  license?: LicenseData;
  message: string;
  error?: string;
}

export default function VerificationPage() {
  const params = useParams();
  const licenseNumber = (params?.license ?? '') as string;
  
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (licenseNumber) {
      verifyLicense();
    }
  }, [licenseNumber]);

  const verifyLicense = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/qr-codes/verify?license=${encodeURIComponent(licenseNumber)}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify license');
      }
      
      setVerificationResult(result);
      
    } catch (error) {
      console.error('Error verifying license:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify license';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLicenseTypeName = (type: string): string => {
    switch (type) {
      case 'car':
        return 'Private Car License (Class B)';
      case 'motorcycle':
        return 'Motorcycle License (Class A)';
      case 'commercial':
        return 'Commercial License (Class C)';
      default:
        return 'Driver License';
    }
  };

  const getStatusColor = (valid: boolean, expired: boolean): string => {
    if (valid) return 'text-green-600';
    if (expired) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusIcon = (valid: boolean, expired: boolean) => {
    if (valid) return faCheck;
    if (expired) return faExclamationTriangle;
    return faTimes;
  };

  const getStatusBgColor = (valid: boolean, expired: boolean): string => {
    if (valid) return 'bg-green-50 border-green-200';
    if (expired) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faShield} className="w-8 h-8 text-blue-600" />
            </div>
            
            <h1 className="text-2xl font-inter font-bold text-gray-900 mb-2">
              License Verification
            </h1>
            
            <p className="text-gray-600 font-inter">
              Verifying license number: <span className="font-mono text-gray-900">{licenseNumber}</span>
            </p>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Verifying license...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-600">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {verificationResult && !isLoading && (
            <div className="space-y-6">
              {/* Verification Status */}
              <div className={`p-6 rounded-lg border-2 ${getStatusBgColor(verificationResult.valid, verificationResult.expired)}`}>
                <div className="flex items-center justify-center mb-4">
                  <FontAwesomeIcon 
                    icon={getStatusIcon(verificationResult.valid, verificationResult.expired)} 
                    className={`w-8 h-8 ${getStatusColor(verificationResult.valid, verificationResult.expired)}`}
                  />
                </div>
                
                <h2 className={`text-xl font-inter font-bold text-center mb-2 ${getStatusColor(verificationResult.valid, verificationResult.expired)}`}>
                  {verificationResult.valid ? 'Valid License' : 
                   verificationResult.expired ? 'Expired License' : 'Invalid License'}
                </h2>
                
                <p className={`text-center ${getStatusColor(verificationResult.valid, verificationResult.expired)}`}>
                  {verificationResult.message}
                </p>
              </div>

              {/* License Details */}
              {verificationResult.license && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <FontAwesomeIcon icon={faIdCard} className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="text-lg font-inter font-semibold text-gray-900">License Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">License Number</label>
                      <p className="text-gray-900 font-mono">{verificationResult.license.license_number}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Holder Name</label>
                      <p className="text-gray-900">{verificationResult.license.holder_name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">National ID</label>
                      <p className="text-gray-900">{verificationResult.license.national_id}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">License Type</label>
                      <p className="text-gray-900">{getLicenseTypeName(verificationResult.license.license_type)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Issue Date</label>
                      <p className="text-gray-900">{formatDate(verificationResult.license.issue_date)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                      <p className={`font-medium ${verificationResult.expired ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(verificationResult.license.expiry_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-inter font-medium text-blue-800 mb-2">
                  Verification Information
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• This verification was performed in real-time</li>
                  <li>• License status is checked against the official database</li>
                  <li>• Valid licenses are issued by the Republic of Burundi</li>
                  <li>• For questions about this license, contact the licensing authority</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-inter font-medium"
                >
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4" />
                  <span>Verify Again</span>
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-all font-inter font-medium"
                >
                  <span>Go Back</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}