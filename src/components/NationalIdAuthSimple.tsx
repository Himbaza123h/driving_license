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
  faToggleOff,
  faToggleOn,
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
  const [step, setStep] = useState<
    "id-entry" | "otp-verification" | "permissions"
  >("id-entry");
  const [nationalId, setNationalId] = useState("");
  const [otp, setOtp] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [citizenData, setCitizenData] = useState<CitizenData | null>(null);
  const [displayOtp, setDisplayOtp] = useState("");

  // Permission states
  const [permissions, setPermissions] = useState({
    email: false,
    birthdate: false,
    gender: false,
    name: false,
    phoneNumber: false,
    picture: false,
  });

  // Ref for the submit button to control its state
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Debug component mount and initial state
  useEffect(() => {
    console.log("🏗️ NationalIdAuth component mounted (Supabase mode)");
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

  const resetState = () => {
    setStep("id-entry");
    setNationalId("");
    setOtp("");
    setDisplayOtp("");
    setTransactionId("");
    setLoading(false);
    setError("");
    setSuccess("");
    setCitizenData(null);
    setPermissions({
      email: false,
      birthdate: false,
      gender: false,
      name: false,
      phoneNumber: false,
      picture: false,
    });
    console.log("🔄 Component state reset");
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

    console.log("🔄 Starting Supabase auth flow");
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("🔄 Starting auth flow with National ID:", cleanNationalId);

      // Initiate auth (verify National ID and generate OTP)
      const authResult = await supabaseAuthService.initiateAuth(
        cleanNationalId
      );
      console.log("Auth initiation result:", authResult);

      if (!authResult.success) {
        console.log("❌ Auth initiation failed:", authResult.message);
        setError(authResult.message || "Login with MOSIP failed");
        return;
      }

      // SUCCESS - Switch to OTP screen
      console.log(
        "✅ Auth initiated successfully, transaction ID:",
        authResult.transactionId
      );
      setDisplayOtp(authResult.otp || "123456");
      setTransactionId(authResult.transactionId!);
      setStep("otp-verification");
      setSuccess(
        authResult.message || "OTP sent to your registered phone number"
      );
    } catch (error) {
      console.error("Auth flow error:", error);

      let errorMessage = "Connection error. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Authentication error: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    console.log("🔄 Starting OTP verification");
    setLoading(true);
    setError("");

    try {
      console.log("Verifying OTP:", { nationalId, otp, transactionId });
      const verifyResult = await supabaseAuthService.verifyOtp(
        nationalId,
        otp,
        transactionId
      );
      console.log("OTP verification result:", verifyResult);

      if (!verifyResult.success) {
        console.log("❌ OTP verification failed:", verifyResult.message);
        setError(verifyResult.message || "OTP verification failed");
        return;
      }

      if (!verifyResult.citizenData) {
        console.log("❌ No citizen data returned");
        setError("Authentication failed: No user data");
        return;
      }

      // SUCCESS - Store citizen data and move to permissions
      // SUCCESS - Check if user has already set permissions
      console.log("✅ OTP verification successful! Checking permissions...");
      setCitizenData(verifyResult.citizenData);

      // Check if user has existing permissions
      try {
        const apiUrl =
          process.env.NODE_ENV === "development"
            ? "/api/permissions"
            : `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/permissions`;

        const permissionsResponse = await fetch(
          `${apiUrl}?nationalId=${verifyResult.citizenData.nationalId}`
        );
        if (permissionsResponse.ok) {
          // User has existing permissions, skip to success
          console.log(
            "✅ User has existing permissions, skipping permissions step"
          );
          setSuccess("Authentication successful! Welcome back.");

          // Mark permissions as completed
          sessionStorage.setItem("permissions_completed", "true");

          setTimeout(() => {
            if (verifyResult.citizenData) {
              onSuccess(verifyResult.citizenData);
            }
          }, 1000);
        } else {
          // User doesn't have permissions, show permissions step
          console.log("📋 User needs to set permissions");
          setStep("permissions");
          setSuccess(
            "Authentication successful! Please review data sharing permissions."
          );
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        // On error, default to showing permissions step
        setStep("permissions");
        setSuccess(
          "Authentication successful! Please review data sharing permissions."
        );
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const handleBackToId = () => {
    setStep("id-entry");
    setError("");
    setSuccess("");
  };

  const handlePermissionsAllow = async () => {
    if (!citizenData) {
      setError("No user data available");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const apiUrl =
        process.env.NODE_ENV === "development"
          ? "/api/permissions"
          : `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/permissions`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nationalId,
          permissions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save permissions");
      }

      const result = await response.json();
      console.log("Permissions saved:", result);

      // The response will tell you if it was an update or new creation
      if (result.isUpdate) {
        setSuccess("Permissions updated successfully! Redirecting...");
      } else {
        setSuccess("Permissions saved successfully! Redirecting...");
      }

      // Mark permissions as completed
      sessionStorage.setItem("permissions_completed", "true");

      setTimeout(() => {
        onSuccess(citizenData);
      }, 1000);
    } catch (error) {
      console.error("Permissions error:", error);
      setError("Failed to save permissions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon
            icon={faShieldAlt}
            className="w-8 h-8 text-green-600"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {step === "permissions"
            ? "Data Sharing Permissions"
            : "Login with MOSIP"}
        </h2>
        <p className="text-gray-600 text-sm">
          {step === "id-entry"
            ? "Enter your National ID number to verify your identity"
            : step === "otp-verification"
            ? "Enter the OTP sent to your registered phone number"
            : "Please review and approve the data sharing permissions below"}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === "id-entry"
                ? "bg-green-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            {step === "otp-verification" || step === "permissions" ? (
              <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
            ) : (
              "1"
            )}
          </div>
          <div
            className={`w-12 h-1 ${
              step === "otp-verification" || step === "permissions"
                ? "bg-green-600"
                : "bg-gray-300"
            }`}
          ></div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === "otp-verification"
                ? "bg-green-600 text-white"
                : step === "permissions"
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {step === "permissions" ? (
              <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
            ) : (
              "2"
            )}
          </div>
          <div
            className={`w-12 h-1 ${
              step === "permissions" ? "bg-green-600" : "bg-gray-300"
            }`}
          ></div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === "permissions"
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            3
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>ID</span>
          <span>OTP</span>
          <span>Permissions</span>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 flex justify-center">
            <span className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full">
              Supabase Mode - Loading: {loading ? "TRUE" : "FALSE"}
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
        <form onSubmit={handleIdSubmit} className="space-y-4">
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
          {displayOtp && process.env.NODE_ENV === "development" && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm text-center">
                <strong>Development OTP:</strong> {displayOtp}
              </p>
              <p className="text-yellow-600 text-xs text-center mt-1">
                (Use this OTP for testing - expires in 10 minutes)
              </p>
            </div>
          )}
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
              onClick={() => setStep("id-entry")}
              disabled={loading || isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={otp.length !== 6 || loading || isLoading}
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
                  <span>Verify & Continue</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Permissions Step */}
      {step === "permissions" && (
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Essential Claims */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Essential Claims
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Email Address</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.email}
                      onChange={() => handlePermissionToggle("email")}
                      className="sr-only"
                    />
                    <FontAwesomeIcon
                      icon={permissions.email ? faToggleOn : faToggleOff}
                      className={`w-6 h-6 ${
                        permissions.email ? "text-[#2C8E5D]" : "text-gray-400"
                      }`}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Voluntary Claims */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Voluntary Claims
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Birthdate</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.birthdate}
                      onChange={() => handlePermissionToggle("birthdate")}
                      className="sr-only"
                    />
                    <FontAwesomeIcon
                      icon={permissions.birthdate ? faToggleOn : faToggleOff}
                      className={`w-6 h-6 ${
                        permissions.birthdate
                          ? "text-[#2C8E5D]"
                          : "text-gray-400"
                      }`}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Gender</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.gender}
                      onChange={() => handlePermissionToggle("gender")}
                      className="sr-only"
                    />
                    <FontAwesomeIcon
                      icon={permissions.gender ? faToggleOn : faToggleOff}
                      className={`w-6 h-6 ${
                        permissions.gender ? "text-[#2C8E5D]" : "text-gray-400"
                      }`}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Name</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.name}
                      onChange={() => handlePermissionToggle("name")}
                      className="sr-only"
                    />
                    <FontAwesomeIcon
                      icon={permissions.name ? faToggleOn : faToggleOff}
                      className={`w-6 h-6 ${
                        permissions.name ? "text-[#2C8E5D]" : "text-gray-400"
                      }`}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Phone Number</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.phoneNumber}
                      onChange={() => handlePermissionToggle("phoneNumber")}
                      className="sr-only"
                    />
                    <FontAwesomeIcon
                      icon={permissions.phoneNumber ? faToggleOn : faToggleOff}
                      className={`w-6 h-6 ${
                        permissions.phoneNumber
                          ? "text-[#2C8E5D]"
                          : "text-gray-400"
                      }`}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Picture</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.picture}
                      onChange={() => handlePermissionToggle("picture")}
                      className="sr-only"
                    />
                    <FontAwesomeIcon
                      icon={permissions.picture ? faToggleOn : faToggleOff}
                      className={`w-6 h-6 ${
                        permissions.picture ? "text-[#2C8E5D]" : "text-gray-400"
                      }`}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleBackToId}
              disabled={loading || isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 disabled:opacity-50"
            >
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={handlePermissionsAllow}
              disabled={loading || isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="w-4 h-4 animate-spin"
                  />
                  <span>Saving...</span>
                </div>
              ) : (
                <span>Allow</span>
              )}
            </button>
          </div>
        </div>
      )}
      {/* Development Mode Notice */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs text-center">
            <strong>Development Mode:</strong> Using Supabase directly. Use any
            13-digit National ID from the database and any 6-digit OTP for
            testing.
          </p>
        </div>
      )}
    </div>
  );
}
