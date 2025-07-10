"use client";
import React, { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQrcode,
  faPrint,
  faDownload,
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faHome,
  faIdCard
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { LoadingSpinner } from '../components/ApplicationShared';

// Type definitions
interface QRData {
  holderName?: string;
  nationalId?: string;
  licenseType?: string;
  issueDate?: string;
  expiryDate?: string;
}

interface QRCodeData {
  license_number: string;
  qr_code_image: string;
  issue_date: string;
  expiry_date: string;
  created_at: string;
  qr_data?: QRData;
}

interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
}

interface ApplicationData {
  applicationId?: string;
  licenseType?: string;
  personalInfo?: PersonalInfo;
}

interface User {
  id: string;
  email?: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

interface ApplicationContextType {
  applicationData: ApplicationData;
}

export default function QRCodePage(): JSX.Element {
  const { user, isLoading }: AuthContextType = useAuth();
  const router = useRouter();
  const { applicationData }: ApplicationContextType = useApplication();

  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user && applicationData.applicationId) {
      generateQRCode();
    }
  }, [user, applicationData.applicationId]);

  const generateQRCode = async (): Promise<void> => {
    if (!applicationData.applicationId) {
      setError('Application ID not found');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/qr-codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: applicationData.applicationId,
          licenseType: applicationData.licenseType,
          personalInfo: applicationData.personalInfo
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate QR code');
      }

      setQrCodeData(result.data);
    } catch (error) {
      console.error('Error generating QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = (): void => {
    window.print();
  };

  const handleDownload = (): void => {
    if (!qrCodeData?.qr_code_image) return;

    const link = document.createElement('a');
    link.download = `license-qr-${qrCodeData.license_number}.png`;
    link.href = qrCodeData.qr_code_image;
    link.click();
  };

  const getLicenseTypeName = (): string => {
    switch (applicationData.licenseType) {
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return <LoadingSpinner message="Redirecting to sign in..." />;
  }

  // Redirect if no application data
  if (!applicationData.applicationId) {
    router.push('/apply');
    return <LoadingSpinner message="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faQrcode} className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-inter font-bold text-gray-900 mb-2">
              Your License QR Code
            </h1>
            
            <p className="text-gray-600 font-inter">
              Your license QR code has been generated successfully. Print or save this for your records.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-600">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-[#2C8E5D] animate-spin mb-4" />
              <p className="text-gray-600">Generating your QR code...</p>
            </div>
          )}

          {qrCodeData && (
            <div className="space-y-8">
              {/* Print Area */}
              <div className="print-area bg-white p-8 border border-gray-200 rounded-lg">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-inter font-bold text-gray-900 mb-2">
                    Republic of Rwanda - Driver\s License
                  </h2>
                  <p className="text-gray-600">{getLicenseTypeName()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* License Information */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <FontAwesomeIcon icon={faIdCard} className="w-5 h-5 text-[#2C8E5D] mr-2" />
                      <h3 className="text-lg font-inter font-semibold text-gray-900">License Information</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">License Number</label>
                        <p className="text-gray-900 font-mono text-lg">{qrCodeData.license_number}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Holder Name</label>
                        <p className="text-gray-900">
                          {qrCodeData.qr_data?.holderName || 
                           `${applicationData.personalInfo?.firstName || ''} ${applicationData.personalInfo?.lastName || ''}`.trim()}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">National ID</label>
                        <p className="text-gray-900">{qrCodeData.qr_data?.nationalId || applicationData.personalInfo?.nationalId}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Issue Date</label>
                        <p className="text-gray-900">{formatDate(qrCodeData.issue_date)}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                        <p className="text-gray-900">{formatDate(qrCodeData.expiry_date)}</p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="mb-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900 text-center mb-2">
                        QR Code
                      </h3>
                      <p className="text-sm text-gray-600 text-center">
                        Scan to verify license
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
                      {qrCodeData.qr_code_image && qrCodeData.qr_code_image.trim() !== '' ? (
                        <Image
                          src={qrCodeData.qr_code_image}
                          alt="License QR Code"
                          width={200}
                          height={200}
                          className="w-48 h-48"
                          priority
                          onError={(e) => {
                            console.error('QR Code image failed to load:', e);
                            setError('Failed to load QR code image');
                          }}
                        />
                      ) : (
                        <div className="w-48 h-48 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <FontAwesomeIcon icon={faQrcode} className="w-12 h-12 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">QR Code not available</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        Generated on {formatDate(qrCodeData.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Instructions */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-inter font-medium text-blue-800 mb-2">
                    Verification Instructions
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Scan this QR code with any QR code reader</li>
                    <li>• The system will verify the license status in real-time</li>
                    <li>• Valid licenses will show Valid License status</li>
                    <li>• Expired or invalid licenses will be clearly marked</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center no-print">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#2C8E5D] hover:bg-[#245A47] text-white rounded-lg transition-all font-inter font-medium"
                >
                  <FontAwesomeIcon icon={faPrint} className="w-4 h-4" />
                  <span>Print License</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  disabled={!qrCodeData?.qr_code_image}
                  className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-all font-inter font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                  <span>Download QR Code</span>
                </button>
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-all font-inter font-medium"
                >
                  <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>
              </div>

              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <FontAwesomeIcon icon={faCheck} className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="text-lg font-inter font-semibold text-green-800 mb-2">
                  License Generated Successfully!
                </h3>
                <p className="text-sm text-green-700">
                  Your driver\s license has been generated. Keep this QR code safe as it serves as your digital license.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-area {
            box-shadow: none !important;
            border: none !important;
          }
          
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}