"use client";
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIdCard,
  faArrowRight,
  faArrowLeft,
  faShieldAlt,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { supabaseAuthService, type CitizenData } from "@/services/supabaseAuth";

interface NationalIdAuthProps {
  onSuccess: (userData: CitizenData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function NationalIdAuth({
  onSuccess,
  onBack,
  isLoading = false,
}: NationalIdAuthProps) {
  const [step, setStep] = useState<"id-entry" | "otp-verification">("id-entry");
  const [nationalId, setNationalId] = useState("");
  const [otp, setOtp] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Ensure supabaseAuthService is loaded
  useEffect(() => {
    if (supabaseAuthService) {
      console.log("🔧 NationalIdAuth: Supabase auth service loaded");
    }
  }, []);

  // Ref for the submit button to control its state
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Debug component mount and initial state
  useEffect(() => {
    console.log("🏗️ NationalIdAuth component mounted with props:", {
      isLoading,
    });
    console.log("🏗️ Initial state:", {
      step,
      nationalId,
      loading,
      error,
      success,
    });

    // Force blur any focused elements and reset button state
    setTimeout(() => {
      if (submitButtonRef.current) {
        submitButtonRef.current.blur();
        console.log("🔄 Button blurred on mount");
      }
      // Also blur any other focused elements
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
    }, 100);

    console.log("🔄 Component mounted and state initialized");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // For debugging loading state
  useEffect(() => {
    console.log("⚠️ Loading state changed:", loading);
  }, [loading]);

  // Debug when button disabled state might change
  useEffect(() => {
    const isValidLength = nationalId.length === 13;
    const buttonDisabled =
      !nationalId || !isValidLength || loading || isLoading;
    console.log("🔴 Button disabled state check:", {
      nationalId: nationalId,
      nationalIdLength: nationalId.length,
      hasNationalId: !!nationalId,
      isValidLength: isValidLength,
      is13Digits: nationalId.length === 13,
      loading: loading,
      isLoading: isLoading,
      buttonDisabled: buttonDisabled,
    });
  }, [nationalId, loading, isLoading]);

  // Reset loading state when component unmounts
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const validateNationalId = (id: string): boolean => {
    // Clean the input - remove any whitespace
    const cleanId = id.trim().replace(/\s+/g, "");
    console.log("Validating National ID:", cleanId, "Length:", cleanId.length);

    // Burundi National ID format: Accept 13-digit format (as per setup.sql)
    // Example: 1198700123456 (13 digits)
    const burundianIdPattern = /^\d{13}$/;
    const isValid = burundianIdPattern.test(cleanId);
    console.log("Validation result:", isValid, "(expecting 13 digits)");
    return isValid;
  };

  const handleIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clean the national ID input
    const cleanNationalId = nationalId.trim().replace(/\s+/g, "");
    console.log("Submitting National ID:", cleanNationalId);

    if (!validateNationalId(cleanNationalId)) {
      setError("Please enter a valid 13-digit National ID number");
      return;
    }

    // Debug the API configuration
    console.log(
      "🌐 Backend API URL being used:",
      process.env.NEXT_PUBLIC_BACKEND_API_URL
    );
    console.log("🌐 Environment:", process.env.NODE_ENV);

    // Explicitly start loading
    console.log("🔄 Setting loading state to TRUE");
    setNationalId(cleanNationalId); // Update state with clean value
    setLoading(true);
    setError("");
    setSuccess("");

    let authTxnId = "";

    try {
      // STEP 1: Initiate auth
      console.log("STEP 1: Initiating authentication");
      const authResult = await supabaseAuthService.initiateAuth(
        cleanNationalId
      );
      console.log("Auth result:", authResult);

      if (!authResult.success) {
        console.log("❌ Auth initiation failed:", authResult.message);
        setError(authResult.message || "Authentication failed");
        console.log(
          "🔄 Setting loading state to FALSE - Auth initiation failed"
        );
        setLoading(false);
        return;
      }

      if (!authResult.transactionId) {
        console.error("❌ Missing transaction ID in auth result:", authResult);
        setError("Authentication failed: Missing transaction ID");
        console.log(
          "🔄 Setting loading state to FALSE - Missing transaction ID"
        );
        setLoading(false);
        return;
      }

      authTxnId = authResult.transactionId;

      // STEP 2: In the simplified flow, OTP is automatically "sent" (mocked)
      console.log("STEP 2: OTP sent (mocked), txn:", authTxnId);

      // SUCCESS - Switch to OTP screen
      console.log("✅ Auth flow successful, transaction ID:", authTxnId);
      setTransactionId(authTxnId);
      setStep("otp-verification");
      setSuccess("OTP sent to your registered phone number");
    } catch (error) {
      console.error("Auth flow error:", error);
      console.error("Error details:", {
        type: error?.constructor?.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // More specific error message
      let errorMessage = "Connection error. Please try again.";
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "Cannot connect to backend server. Please check if the server is running on port 8090.";
      } else if (error instanceof Error) {
        errorMessage = `Backend error: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      // Always reset loading state
      console.log("🔄 Setting loading state to FALSE - Finally block");
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    console.log("🔄 Starting OTP verification, setting loading state to TRUE");
    setLoading(true);
    setError("");

    try {
      console.log("Verifying OTP:", { nationalId, otp, transactionId });
      const verifyResult = await supabaseAuthService.verifyOtp(
        nationalId.trim().replace(/\s+/g, ""), // Clean the ID for verification too
        otp,
        transactionId
      );

      console.log("OTP verification result:", verifyResult);

      if (verifyResult.success && verifyResult.citizenData) {
        setSuccess("Authentication successful!");
        // Reset loading before calling onSuccess to prevent UI issues
        console.log(
          "🔄 Setting loading state to FALSE - OTP verification succeeded"
        );
        setLoading(false);
        onSuccess(verifyResult.citizenData);
      } else {
        console.log("❌ OTP verification failed:", verifyResult.message);
        setError(verifyResult.message || "OTP verification failed");
        console.log(
          "🔄 Setting loading state to FALSE - OTP verification failed"
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Network error. Please check your connection and try again.");
      console.log("🔄 Setting loading state to FALSE - OTP verification error");
      setLoading(false);
    }
  };

  const handleBackToId = () => {
    setStep("id-entry");
    setOtp("");
    setError("");
    setSuccess("");
  };

  const resetState = () => {
    console.log("🔄 Manually resetting component state");
    setLoading(false);
    setError("");
    setSuccess("");
    setStep("id-entry");
    setOtp("");
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon
            icon={faShieldAlt}
            className="w-8 h-8 text-green-600"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify with National ID
        </h2>
        <p className="text-gray-600">
          {step === "id-entry"
            ? "Enter your National ID number to verify your identity"
            : "Enter the OTP sent to your registered phone number"}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "id-entry"
                ? "bg-green-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            {step === "otp-verification" ? (
              <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
            ) : (
              "1"
            )}
          </div>
          <div
            className={`w-16 h-1 ${
              step === "otp-verification" ? "bg-green-600" : "bg-gray-300"
            }`}
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "otp-verification"
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            2
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>National ID</span>
          <span>OTP Verification</span>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 flex justify-center">
            <span className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full">
              Loading state: {loading ? "TRUE" : "FALSE"}
            </span>
            {loading && (
              <button
                onClick={resetState}
                className="ml-2 bg-red-50 text-red-800 text-xs px-2 py-1 rounded-full"
              >
                Reset State
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="w-4 h-4 text-red-500 mr-2"
          />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="w-4 h-4 text-green-500 mr-2"
          />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* National ID Entry Form */}
      {step === "id-entry" && (
        <form
          onSubmit={(e) => {
            console.log("🚀 FORM SUBMISSION TRIGGERED!");
            handleIdSubmit(e);
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="nationalId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              National ID Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faIdCard}
                  className="w-5 h-5 text-gray-400"
                />
              </div>
              <input
                type="text"
                id="nationalId"
                value={nationalId}
                onChange={(e) =>
                  setNationalId(e.target.value.replace(/\D/g, "").slice(0, 13))
                }
                placeholder="Enter 13-digit National ID"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                disabled={loading || isLoading}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Format: 13 digits (e.g., 1198700123456)
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onBack}
              disabled={loading || isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={
                !nationalId || nationalId.length !== 13 || loading || isLoading
              }
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
                !nationalId || nationalId.length !== 13 || loading || isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-60"
                  : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              }`}
              onClick={() => {
                console.log("🔥 SEND OTP BUTTON CLICKED!");
                console.log("Current nationalId:", nationalId);
                console.log("Current nationalId length:", nationalId.length);
                console.log("Loading state:", loading);
                console.log("isLoading prop:", isLoading);
                console.log("Has nationalId?", !!nationalId);
                console.log("Is 13 digits?", nationalId.length === 13);
                const disabled =
                  !nationalId ||
                  nationalId.length !== 13 ||
                  loading ||
                  isLoading;
                console.log("Button disabled?", disabled);
                console.log("Disabled reasons:", {
                  noNationalId: !nationalId,
                  invalidLength: nationalId.length !== 13,
                  loading: loading,
                  isLoading: isLoading,
                });
                // Don't prevent default - let the form submission happen
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="w-4 h-4 animate-spin"
                  />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <span>Send OTP</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* OTP Verification Form */}
      {step === "otp-verification" && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Verification Code (OTP)
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono tracking-widest text-gray-900"
              disabled={loading || isLoading}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Development mode: Any 6-digit code will work for testing
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBackToId}
              disabled={loading || isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={!otp || loading || isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="w-4 h-4 animate-spin"
                  />
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  <span>Verify</span>
                  <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setSuccess("");
                setError("");
                // Resend OTP logic here
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
              disabled={loading || isLoading}
            >
              Didn&apos;t receive code? Resend OTP
            </button>
          </div>
        </form>
      )}

      {/* Development Note */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Development Mode:</strong> Use any 16-digit number for
          National ID and 123456 for OTP testing.
        </p>
      </div>
    </div>
  );
}
