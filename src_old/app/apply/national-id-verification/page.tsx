"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faShieldAlt,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useApplication } from "@/contexts/ApplicationContext";
import {
  ApplicationSteps,
  LoadingSpinner,
} from "../components/ApplicationShared";
import NationalIdAuth from "@/components/NationalIdAuthSimple";
import { type CitizenData } from "@/services/supabaseAuth";

export default function NationalIdVerificationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { applicationData, updatePersonalInfo, setCurrentStep } =
    useApplication();
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verifiedData, setVerifiedData] = useState<CitizenData | null>(null);

  useEffect(() => {
    setCurrentStep(1.5); // Between license selection and personal info
  }, [setCurrentStep]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // If user is not authenticated, let ConditionalLayout handle the redirect
  if (!user) {
    return null;
  }

  // Redirect if no license type selected
  if (!applicationData.licenseType) {
    router.push("/apply");
    return <LoadingSpinner message="Redirecting..." />;
  }

  const handleVerificationSuccess = (citizenData: CitizenData) => {
    setVerifiedData(citizenData);
    setVerificationComplete(true);

    // Parse full name into first and last name
    const nameParts = citizenData.fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Auto-fill personal information with verified data
    updatePersonalInfo({
      firstName,
      lastName,
      dateOfBirth: citizenData.dateOfBirth,
      nationalId: citizenData.nationalId,
      phoneNumber: citizenData.phoneNumber,
      email: citizenData.email || "",
      address: {
        province: "",
        commune: "",
        zone: "",
        street: citizenData.address,
      },
      emergencyContact: {
        name: "",
        relationship: "",
        phoneNumber: "",
      },
      // Set some default values that weren't provided by National ID
      placeOfBirth: "",
      gender: "",
      nationality: "Burundian",
    });
  };

  const handleContinue = () => {
    router.push("/apply/personal-info");
  };

  const handleSkip = () => {
    router.push("/apply/personal-info");
  };

  const handleBack = () => {
    router.push("/apply");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationSteps currentStep={1.5} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <FontAwesomeIcon
                  icon={faShieldAlt}
                  className="w-6 h-6 text-green-600"
                />
              </div>
              <div>
                <h2 className="text-2xl font-inter font-bold text-gray-900">
                  Login with MOSIP
                </h2>
                <p className="text-gray-600 font-inter">
                  Verify your identity to speed up your application process
                </p>
              </div>
            </div>
          </div>

          {!verificationComplete ? (
            <div className="space-y-6">
              {/* Benefits of verification */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-inter font-medium text-blue-800 mb-2">
                  Benefits of Login with MOSIP:
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Auto-fill your personal information</li>
                  <li>• Faster application processing</li>
                  <li>• Enhanced security and fraud prevention</li>
                  <li>• Skip manual data entry</li>
                </ul>
              </div>

              {/* National ID Auth Component */}
              <div className="flex justify-center">
                <NationalIdAuth
                  key="apply-flow-national-id" // Force fresh component mount
                  onSuccess={handleVerificationSuccess}
                  onBack={handleBack}
                  isLoading={false}
                />
              </div>

              {/* Skip option */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-3">
                  You can also continue without verification and fill the form
                  manually
                </p>
                <button
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 font-medium text-sm underline"
                >
                  Skip verification and continue
                </button>
              </div>
            </div>
          ) : (
            /* Verification Success */
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="w-8 h-8 text-green-600"
                />
              </div>

              <div>
                <h3 className="text-xl font-inter font-bold text-gray-900 mb-2">
                  Verification Successful!
                </h3>
                <p className="text-gray-600 font-inter">
                  Your identity has been verified. Your personal information
                  will be pre-filled in the next step.
                </p>
              </div>

              {/* Show verified data preview */}
              {verifiedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h4 className="font-inter font-medium text-green-800 mb-3">
                    Verified Information:
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Name:</span>
                      <span className="text-green-900 font-medium">
                        {verifiedData.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">National ID:</span>
                      <span className="text-green-900 font-medium">
                        {verifiedData.nationalId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Date of Birth:</span>
                      <span className="text-green-900 font-medium">
                        {verifiedData.dateOfBirth}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleContinue}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-inter font-medium mx-auto"
              >
                <span>Continue to Personal Information</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Buttons - only show when not in auth flow */}
          {!verificationComplete && (
            <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-inter font-medium text-gray-700"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                <span>Back to License Selection</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
