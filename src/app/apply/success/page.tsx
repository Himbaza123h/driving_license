"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faDownload,
  faHome,
  faFileText,
  faCalendarAlt,
  faIdCard,
  faCreditCard,
  faInfoCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useApplication } from "@/contexts/ApplicationContext";
import {
  ApplicationSteps,
  LoadingSpinner,
} from "../components/ApplicationShared";

// Types
type LicenseInfo = {
  type: string;
  category: string;
  price: number;
  duration: string;
  description: string;
};

type PaymentInfo = {
  transactionId: string;
  amount: number;
  method: string;
  timestamp: string;
  status: string;
};

type ApplicationData = {
  applicationId: string;
  licenseInfo: LicenseInfo;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationality: string;
    address: {
      street: string;
      city: string;
      district: string;
      postalCode: string;
    };
  };
  documents: {
    identityDocument: string;
    passport?: string;
    photo: string;
    additionalDocuments?: string[];
  };
  submittedAt: string;
  estimatedProcessingTime: string;
  referenceNumber: string;
};

const SuccessPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { setCurrentStep } = useApplication();

  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setCurrentStep(7);
    loadSuccessData();
  }, [setCurrentStep]);

  const loadSuccessData = async (): Promise<void> => {
    try {
      // Check if payment was successful
      const paymentSuccess = sessionStorage.getItem("paymentSuccess");
      const transactionId = sessionStorage.getItem("transactionId");
      
      if (!paymentSuccess || !transactionId) {
        router.push("/apply");
        return;
      }

      // Get application data
      const storedApplication = sessionStorage.getItem("pendingApplication");
      if (storedApplication) {
        const parsedApplication: ApplicationData = JSON.parse(storedApplication);
        setApplicationData(parsedApplication);
      }

      // Get payment information
      const paymentData: PaymentInfo = {
        transactionId: transactionId,
        amount: 0, // Will be set from application data
        method: sessionStorage.getItem("paymentMethod") || "card",
        timestamp: new Date().toISOString(),
        status: "completed"
      };

      setPaymentInfo(paymentData);

    } catch (error) {
      console.error("Error loading success data:", error);
      setError("Failed to load application data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-BU', {
      style: 'currency',
      currency: 'FBU'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-BU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generatePDFReceipt = async (): Promise<void> => {
    if (!applicationData || !paymentInfo) return;

    setDownloadingPdf(true);
    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Colors
      const primaryColor = [37, 99, 235]; // Blue
      const secondaryColor = [75, 85, 99]; // Gray
      const successColor = [34, 197, 94]; // Green
      
      // Helper function to ensure text is a string
      const safeText = (text: unknown): string => {
        if (text === null || text === undefined) return '';
        return String(text);
      };
      
      // Header with company branding
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company Logo/Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('BURUNDI LICENSING AUTHORITY', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Official License Application Receipt', pageWidth / 2, 30, { align: 'center' });
      
      // Receipt title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT RECEIPT', pageWidth / 2, 55, { align: 'center' });
      
      // Success checkmark (simulate with text)
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      doc.setFontSize(16);
      doc.text('✓ PAYMENT SUCCESSFUL', pageWidth / 2, 70, { align: 'center' });
      
      // Receipt details box
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(20, 80, pageWidth - 40, 60);
      
      // Receipt information
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      let yPos = 95;
      
      // Reference number (prominent)
      doc.setFontSize(14);
      doc.text('Reference Number:', 25, yPos);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(safeText(applicationData.referenceNumber), 25, yPos + 10);
      
      // Transaction ID
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text('Transaction ID:', 25, yPos + 25);
      doc.setFont('helvetica', 'normal');
      doc.text(safeText(paymentInfo.transactionId), 25, yPos + 35);
      
      // Date
      doc.setFont('helvetica', 'bold');
      doc.text('Date & Time:', pageWidth / 2 + 10, yPos + 25);
      doc.setFont('helvetica', 'normal');
      doc.text(safeText(formatDate(paymentInfo.timestamp)), pageWidth / 2 + 10, yPos + 35);
      
      // Application details section
      yPos = 155;
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos, pageWidth - 40, 50, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, yPos, pageWidth - 40, 50);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('APPLICATION DETAILS', 25, yPos + 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Left column
      doc.text('Applicant Name:', 25, yPos + 25);
      const fullName = `${safeText(applicationData.personalInfo.firstName)} ${safeText(applicationData.personalInfo.lastName)}`;
      doc.text(fullName, 25, yPos + 35);
      
      doc.text('License Type:', 25, yPos + 45);
      doc.text(safeText(applicationData.licenseInfo.type), 25, yPos + 55);
      
      // Right column
      doc.text('Email:', pageWidth / 2 + 10, yPos + 25);
      doc.text(safeText(applicationData.personalInfo.email), pageWidth / 2 + 10, yPos + 35);
      
      doc.text('Category:', pageWidth / 2 + 10, yPos + 45);
      doc.text(safeText(applicationData.licenseInfo.category), pageWidth / 2 + 10, yPos + 55);
      
      // Payment details section
      yPos = 220;
      doc.setFillColor(successColor[0], successColor[1], successColor[2]);
      doc.rect(20, yPos, pageWidth - 40, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT DETAILS', 25, yPos + 15);
      
      doc.setFontSize(12);
      doc.text('Amount Paid:', 25, yPos + 25);
      doc.setFontSize(16);
      doc.text(safeText(formatCurrency(applicationData.licenseInfo.price)), pageWidth / 2 + 10, yPos + 25);
      
      // Status
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text('Payment Method:', 25, yPos + 40);
      doc.text(safeText(paymentInfo.method.toUpperCase()), 25, yPos + 50);
      
      doc.text('Status:', pageWidth / 2 + 10, yPos + 40);
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPLETED', pageWidth / 2 + 10, yPos + 50);
      
      // Footer
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This is an official receipt generated by Burundi Licensing Authority', pageWidth / 2, pageHeight - 30, { align: 'center' });
      doc.text('For inquiries, contact: info@rla.gov.bu | +250 788 123 456', pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text(`Generated on: ${safeText(new Date().toLocaleString())}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Save the PDF
      doc.save(`receipt-${safeText(applicationData.referenceNumber)}.pdf`);
      
    } catch (error) {
      console.error("PDF generation error:", error);
      setError("Failed to generate PDF receipt");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadConfirmation = async (): Promise<void> => {
    await generatePDFReceipt();
  };

  const goToHome = (): void => {
    // Clear session storage
    sessionStorage.removeItem("pendingApplication");
    sessionStorage.removeItem("paymentSuccess");
    sessionStorage.removeItem("transactionId");
    sessionStorage.removeItem("paymentMethod");
    
    router.push("/dashboard");
  };

  const goToApplications = (): void => {
    router.push("/my-applications");
  };

  // Show loading while checking authentication
  if (isLoading || isLoadingData) {
    return <LoadingSpinner message="Loading confirmation..." />;
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faInfoCircle} className="text-red-500 text-6xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={goToHome}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!applicationData) {
    return <LoadingSpinner message="Loading application data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Application Submitted Successfully
            </h1>
            <ApplicationSteps currentStep={7} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl mr-4" />
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Application Submitted Successfully!
              </h2>
              <p className="text-green-700">
                Your license application has been submitted and payment has been processed.
                You will receive updates via email and SMS.
              </p>
            </div>
          </div>
        </div>

        {/* Application Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Application Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-3">
                <FontAwesomeIcon icon={faIdCard} className="text-blue-500 mr-2" />
                <span className="font-medium text-gray-900">Reference Number</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                {applicationData.referenceNumber}
              </p>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">License Type:</span>
                  <p className="text-gray-900">{applicationData.licenseInfo.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <p className="text-gray-900">{applicationData.licenseInfo.category}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Applicant:</span>
                  <p className="text-gray-900">
                    {applicationData.personalInfo.firstName} {applicationData.personalInfo.lastName}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 mr-2" />
                <span className="font-medium text-gray-900">Timeline</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <p className="text-gray-900">{formatDate(applicationData.submittedAt)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Estimated Processing:</span>
                  <p className="text-gray-900">{applicationData.estimatedProcessingTime}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <p className="text-gray-900">{applicationData.licenseInfo.duration}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {paymentInfo && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-3">
                  <FontAwesomeIcon icon={faCreditCard} className="text-green-500 mr-2" />
                  <span className="font-medium text-gray-900">Transaction Details</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Transaction ID:</span>
                    <p className="text-gray-900 font-mono">{paymentInfo.transactionId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Amount:</span>
                    <p className="text-gray-900 font-bold text-lg">
                      {formatCurrency(applicationData.licenseInfo.price)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Payment Method:</span>
                    <p className="text-gray-900 capitalize">{paymentInfo.method}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center mb-3">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                  <span className="font-medium text-gray-900">Payment Status</span>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">Payment Completed</p>
                  <p className="text-green-700 text-sm">
                    Processed on {formatDate(paymentInfo.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            What happens next?
          </h3>
          
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                1
              </span>
              <p>Your application will be reviewed by our licensing department</p>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                2
              </span>
              <p>You will receive email and SMS updates on the progress</p>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                3
              </span>
              <p>If approved, your license will be issued and sent to your registered address</p>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                4
              </span>
              <p>You can track your application status in your dashboard</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={downloadConfirmation}
            disabled={downloadingPdf}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {downloadingPdf ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
            ) : (
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
            )}
            Download Receipt
          </button>
          
          <button
            onClick={goToApplications}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FontAwesomeIcon icon={faFileText} className="mr-2" />
            View Applications
          </button>
          
          <button
            onClick={goToHome}
            className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FontAwesomeIcon icon={faHome} className="mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;