"use client";
import React, { useState, useEffect, useRef, JSX } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQrcode,
  faSearch,
  faCheck,
  faExclamationTriangle,
  faTimes,
  faSpinner,
  faIdCard,
  faCalendarAlt,
  faUser,
  faCamera,
  faStop,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';

// Type definitions
interface VerificationData {
  licenseNumber: string;
  holderName?: string;
  licenseType: string;
  nationalId?: string;
  issueDate: string;
  expiryDate: string;
  applicationStatus?: string;
}

interface VerificationResult {
  valid: boolean;
  status: 'valid' | 'expired' | 'invalid';
  message: string;
  data?: VerificationData;
}

type ActiveTab = 'qr' | 'manual';
type VerificationStatus = 'valid' | 'expired' | 'invalid';

export default function VerifyPage(): JSX.Element {
  const [qrInput, setQrInput] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('qr');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const verifyQRCode = async (data: string): Promise<void> => {
    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await fetch('/api/qr-codes/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: data }),
      });

      const result: VerificationResult = await response.json();
      setVerificationResult(result);
      
      if (!result.valid) {
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyByLicenseNumber = async (licenseNum: string): Promise<void> => {
    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await fetch(`/api/qr-codes/verify?licenseNumber=${encodeURIComponent(licenseNum)}`);
      const result: VerificationResult = await response.json();
      setVerificationResult(result);
      
      if (!result.valid) {
        setError(result.message || 'License not found');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('License lookup error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQRSubmit = (): void => {
    if (!qrInput.trim()) {
      setError('Please enter QR code data');
      return;
    }
    verifyQRCode(qrInput.trim());
  };

  const handleLicenseSubmit = (): void => {
    if (!licenseNumber.trim()) {
      setError('Please enter license number');
      return;
    }
    verifyByLicenseNumber(licenseNumber.trim());
  };

  const startScanning = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
      setError('');
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  const stopScanning = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const captureAndAnalyze = (): void => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Simulate QR detection (replace with actual QR code detection)
    // Example: const code = jsQR(imageData.data, imageData.width, imageData.height);
    setError('QR code scanning requires additional QR code detection library (jsQR)');
  };

  const resetVerification = (): void => {
    setVerificationResult(null);
    setError('');
    setQrInput('');
    setLicenseNumber('');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: VerificationStatus): string => {
    switch (status) {
      case 'valid': return 'text-green-600';
      case 'expired': return 'text-yellow-600';
      case 'invalid': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'valid': return faCheck;
      case 'expired': return faExclamationTriangle;
      case 'invalid': return faTimes;
      default: return faIdCard;
    }
  };

  const getStatusBgColor = (status: VerificationStatus): string => {
    switch (status) {
      case 'valid': return 'bg-green-50 border-green-200';
      case 'expired': return 'bg-yellow-50 border-yellow-200';
      case 'invalid': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, action: () => void): void => {
    if (e.key === 'Enter') {
      action();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            License Verification
          </h1>
          <p className="text-gray-600">
            Verify licenses by scanning QR codes or entering license numbers
          </p>
        </div>

        {/* Verification Methods Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('qr')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'qr'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FontAwesomeIcon icon={faQrcode} className="mr-2" />
                QR Code
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'manual'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                Manual Lookup
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'qr' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={isScanning ? stopScanning : startScanning}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      isScanning
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <FontAwesomeIcon 
                      icon={isScanning ? faStop : faCamera} 
                      className="mr-2" 
                    />
                    {isScanning ? 'Stop Camera' : 'Start Camera'}
                  </button>
                  
                  {isScanning && (
                    <button
                      onClick={captureAndAnalyze}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                    >
                      <FontAwesomeIcon icon={faQrcode} className="mr-2" />
                      Scan QR Code
                    </button>
                  )}
                </div>

                {isScanning && (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full max-w-md mx-auto rounded-lg border"
                      autoPlay
                      playsInline
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white rounded-lg opacity-75"></div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Or paste QR code data manually:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <textarea
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleQRSubmit)}
                        placeholder="Paste QR code data here..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={4}
                      />
                    </div>
                    <button
                      onClick={handleQRSubmit}
                      disabled={isVerifying || !qrInput.trim()}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      {isVerifying ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faQrcode} className="mr-2" />
                          Verify QR Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleLicenseSubmit)}
                    placeholder="Enter license number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleLicenseSubmit}
                  disabled={isVerifying || !licenseNumber.trim()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {isVerifying ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSearch} className="mr-2" />
                      Verify License
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <div className={`rounded-lg border-2 p-6 ${getStatusBgColor(verificationResult.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={getStatusIcon(verificationResult.status)} 
                  className={`text-2xl mr-3 ${getStatusColor(verificationResult.status)}`}
                />
                <div>
                  <h3 className={`text-xl font-bold ${getStatusColor(verificationResult.status)}`}>
                    {verificationResult.status.toUpperCase()}
                  </h3>
                  <p className="text-gray-600">{verificationResult.message}</p>
                </div>
              </div>
              <button
                onClick={resetVerification}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faRefresh} />
              </button>
            </div>

            {verificationResult.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faIdCard} className="text-blue-500 mr-2" />
                    <span className="font-medium">License Details</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">License Number:</span>
                      <span className="ml-2">{verificationResult.data.licenseNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium">License Type:</span>
                      <span className="ml-2">{verificationResult.data.licenseType}</span>
                    </div>
                    {verificationResult.data.nationalId && (
                      <div>
                        <span className="font-medium">National ID:</span>
                        <span className="ml-2">{verificationResult.data.nationalId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faUser} className="text-green-500 mr-2" />
                    <span className="font-medium">Holder Information</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <span className="ml-2">{verificationResult.data.holderName || 'N/A'}</span>
                    </div>
                    {verificationResult.data.applicationStatus && (
                      <div>
                        <span className="font-medium">Application Status:</span>
                        <span className="ml-2 capitalize">{verificationResult.data.applicationStatus}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-500 mr-2" />
                    <span className="font-medium">Validity Period</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Issue Date:</span>
                      <span className="ml-2">{formatDate(verificationResult.data.issueDate)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Expiry Date:</span>
                      <span className="ml-2">{formatDate(verificationResult.data.expiryDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">How to Verify:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>QR Code:</strong> Use camera to scan QR code or paste QR data manually</li>
            <li>• <strong>Manual Lookup:</strong> Enter the license number directly</li>
            <li>• <strong>Status Types:</strong> Valid (green), Expired (yellow), Invalid (red)</li>
            <li>• <strong>Verification:</strong> All results show detailed license information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}