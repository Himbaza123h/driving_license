"use client";
import React, { useState, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCreditCard,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faLock,
  faUser,
  faCalendarAlt,
  faIdCard,
  faMobile,
  faUniversity,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useApplication } from "@/contexts/ApplicationContext";
import {
  ApplicationSteps,
  LoadingSpinner,
} from "../components/ApplicationShared";

// Interfaces
interface LicenseInfo {
  name: string;
  price: string;
}

interface PendingApplication {
  applicationId: string;
  licenseInfo: LicenseInfo;
}

interface CardForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface MobileForm {
  phoneNumber: string;
  pin: string;
}

interface BankForm {
  accountNumber: string;
  bankName: string;
  accountHolder: string;
}

interface PaymentData {
  applicationId: string;
  amount: string;
  method: PaymentMethod;
  details: CardForm | MobileForm | BankForm;
  timestamp: string;
}

interface PaymentResponse {
  success: boolean;
  error?: string;
  transactionId?: string;
  message?: string;
}

type PaymentMethod = "card" | "mobile" | "bank";

export default function PaymentPage(): JSX.Element | null {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { setCurrentStep, submitApplication } = useApplication();

  const [pendingApplication, setPendingApplication] = useState<PendingApplication | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Form states
  const [cardForm, setCardForm] = useState<CardForm>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const [mobileForm, setMobileForm] = useState<MobileForm>({
    phoneNumber: "",
    pin: "",
  });

  const [bankForm, setBankForm] = useState<BankForm>({
    accountNumber: "",
    bankName: "",
    accountHolder: "",
  });

  useEffect(() => {
    setCurrentStep(6);
    
    // Get pending application data
    const storedApplication = sessionStorage.getItem("pendingApplication");
    if (storedApplication) {
      setPendingApplication(JSON.parse(storedApplication));
    } else {
      // If no pending application, redirect to review
      router.push("/apply/review");
    }
  }, [setCurrentStep, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  if (!pendingApplication) {
    return <LoadingSpinner message="Loading application data..." />;
  }

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    
    // Format card number
    if (name === "cardNumber") {
      const formattedValue = value.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setCardForm(prev => ({
        ...prev,
        [name]: formattedValue.substring(0, 19) // Max 16 digits + 3 spaces
      }));
    }
    // Format expiry date
    else if (name === "expiryDate") {
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2');
      setCardForm(prev => ({
        ...prev,
        [name]: formattedValue.substring(0, 5)
      }));
    }
    // Format CVV
    else if (name === "cvv") {
      setCardForm(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '').substring(0, 3)
      }));
    }
    else {
      setCardForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setMobileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setBankForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePaymentForm = (): boolean => {
    if (paymentMethod === "card") {
      const { cardNumber, expiryDate, cvv, cardholderName } = cardForm;
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        setPaymentError("Please fill in all card details");
        return false;
      }
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setPaymentError("Please enter a valid card number");
        return false;
      }
      if (cvv.length < 3) {
        setPaymentError("Please enter a valid CVV");
        return false;
      }
    } else if (paymentMethod === "mobile") {
      const { phoneNumber, pin } = mobileForm;
      if (!phoneNumber || !pin) {
        setPaymentError("Please fill in all mobile payment details");
        return false;
      }
    } else if (paymentMethod === "bank") {
      const { accountNumber, bankName, accountHolder } = bankForm;
      if (!accountNumber || !bankName || !accountHolder) {
        setPaymentError("Please fill in all bank transfer details");
        return false;
      }
    }
    return true;
  };

  const handlePayment = async (): Promise<void> => {
    if (!validatePaymentForm()) {
      return;
    }

    setIsProcessing(true);
    setPaymentError("");

    try {
      // Prepare payment data
      const paymentData: PaymentData = {
        applicationId: pendingApplication.applicationId,
        amount: pendingApplication.licenseInfo.price,
        method: paymentMethod,
        details: paymentMethod === "card" ? cardForm : 
                 paymentMethod === "mobile" ? mobileForm : bankForm,
        timestamp: new Date().toISOString(),
      };

      // Process payment
      const paymentResponse = await fetch("/api/applications/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      console.log("Payment Response:", paymentResponse);

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Payment processing failed");
      }

      const paymentResult: PaymentResponse = await paymentResponse.json();

      // Fixed: Check for success and show specific error message
      if (!paymentResult.success) {
        // Use the specific error message from the response
        const errorMessage = paymentResult.error || paymentResult.message || "Payment failed";
        setPaymentError(errorMessage);
        return; // Don't throw, just return to show the error
      }

      // Submit application after successful payment
      await submitApplication();

      // Store payment success data
      sessionStorage.setItem("paymentSuccess", "true");
      if (paymentResult.transactionId) {
        sessionStorage.setItem("transactionId", paymentResult.transactionId);
      }

      setPaymentSuccess(true);

      // Navigate to success page after delay
      setTimeout(() => {
        router.push("/apply/success");
      }, 2000);

    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = error instanceof Error ? error.message : "Payment processing failed";
      setPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = (): void => {
    router.push("/apply/review");
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="w-8 h-8 text-green-600"
              />
            </div>
            <h2 className="text-2xl font-inter font-bold text-gray-900 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-600 font-inter mb-6">
              Your payment has been processed successfully. Redirecting to confirmation page...
            </p>
            <div className="flex justify-center">
              <FontAwesomeIcon
                icon={faSpinner}
                className="w-6 h-6 animate-spin text-[#2C8E5D]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationSteps currentStep={6} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-inter font-bold text-gray-900 mb-2">
              Payment Information
            </h2>
            <p className="text-gray-600 font-inter">
              Complete your payment to submit your driver&apos;s license application.
            </p>
          </div>

          {/* Payment Summary */}
          <div className="bg-[#2C8E5D]/5 border border-[#2C8E5D]/20 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-inter font-semibold text-gray-900">
                Payment Summary
              </h3>
              <FontAwesomeIcon
                icon={faInfoCircle}
                className="w-5 h-5 text-[#2C8E5D]"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">License Type:</span>
                <span className="font-medium text-gray-900">
                  {pendingApplication.licenseInfo.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Application ID:</span>
                <span className="font-medium text-gray-900">
                  {pendingApplication.applicationId}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-[#2C8E5D]">
                  {pendingApplication.licenseInfo.price}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">
              Select Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-4 border rounded-lg text-left transition-all ${
                  paymentMethod === "card"
                    ? "border-[#2C8E5D] bg-[#2C8E5D]/5"
                    : "border-gray-200 hover:border-[#2C8E5D]/50"
                }`}
              >
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon
                    icon={faCreditCard}
                    className="w-5 h-5 text-[#2C8E5D] mr-2"
                  />
                  <span className="font-medium text-gray-900">Credit/Debit Card</span>
                </div>
                <p className="text-sm text-gray-600">
                  Pay with your Visa, Mastercard, or other cards
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("mobile")}
                className={`p-4 border rounded-lg text-left transition-all ${
                  paymentMethod === "mobile"
                    ? "border-[#2C8E5D] bg-[#2C8E5D]/5"
                    : "border-gray-200 hover:border-[#2C8E5D]/50"
                }`}
              >
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon
                    icon={faMobile}
                    className="w-5 h-5 text-[#2C8E5D] mr-2"
                  />
                  <span className="font-medium text-gray-900">Mobile Payment</span>
                </div>
                <p className="text-sm text-gray-600">
                  Pay with MTN Mobile Money or Airtel Money
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("bank")}
                className={`p-4 border rounded-lg text-left transition-all ${
                  paymentMethod === "bank"
                    ? "border-[#2C8E5D] bg-[#2C8E5D]/5"
                    : "border-gray-200 hover:border-[#2C8E5D]/50"
                }`}
              >
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon
                    icon={faUniversity}
                    className="w-5 h-5 text-[#2C8E5D] mr-2"
                  />
                  <span className="font-medium text-gray-900">Bank Transfer</span>
                </div>
                <p className="text-sm text-gray-600">
                  Pay via direct bank transfer
                </p>
              </button>
            </div>
          </div>

          {/* Payment Forms */}
          <div className="mb-6">
            {paymentMethod === "card" && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="w-4 h-4 text-gray-400 mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    Your payment information is secure and encrypted
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-1" />
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="cardholderName"
                      value={cardForm.cardholderName}
                      onChange={handleCardInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                      placeholder="Alain jean"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon={faIdCard} className="w-4 h-4 mr-1" />
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardForm.cardNumber}
                      onChange={handleCardInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-1" />
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardForm.expiryDate}
                      onChange={handleCardInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                      placeholder="MM/YY"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon={faLock} className="w-4 h-4 mr-1" />
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardForm.cvv}
                      onChange={handleCardInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "mobile" && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="w-4 h-4 text-gray-400 mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    Secure mobile payment processing
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faMobile} className="w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={mobileForm.phoneNumber}
                    onChange={handleMobileInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                    placeholder="+250 700 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faLock} className="w-4 h-4 mr-1" />
                    Mobile Money PIN
                  </label>
                  <input
                    type="password"
                    name="pin"
                    value={mobileForm.pin}
                    onChange={handleMobileInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                    placeholder="Enter your PIN"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "bank" && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="w-4 h-4 text-gray-400 mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    Secure bank transfer processing
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-1" />
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={bankForm.accountHolder}
                    onChange={handleBankInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                    placeholder="Alain Jean"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faUniversity} className="w-4 h-4 mr-1" />
                    Bank Name
                  </label>
                  <select
                    name="bankName"
                    value={bankForm.bankName}
                    onChange={handleBankInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                  >
                    <option value="">Select Bank</option>
                    <option value="Bank of Kigali">Bank of Kigali</option>
                    <option value="Equity Bank">Equity Bank</option>
                    <option value="Cogebanque">Cogebanque</option>
                    <option value="I&M Bank">I&M Bank</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="Crane Bank">Crane Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faIdCard} className="w-4 h-4 mr-1" />
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankForm.accountNumber}
                    onChange={handleBankInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent"
                    placeholder="1234567890"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {paymentError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="w-5 h-5 text-red-600 mr-2"
                />
                <span className="text-red-700 font-medium">{paymentError}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
              Back to Review
            </button>

            <button
              type="button"
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex items-center px-8 py-3 bg-[#2C8E5D] text-white rounded-md hover:bg-[#2C8E5D]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="w-4 h-4 mr-2 animate-spin"
                  />
                  Processing Payment...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faLock} className="w-4 h-4 mr-2" />
                  Pay Now
                </>
              )}
            </button>
          </div>

          {/* Payment Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <FontAwesomeIcon
                icon={faInfoCircle}
                className="w-5 h-5 text-blue-600 mr-2 mt-0.5"
              />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Secure Payment:</strong> Your payment information is protected with 
                  256-bit SSL encryption. We never store your card details on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}