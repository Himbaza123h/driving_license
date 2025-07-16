"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEdit,
  faFileAlt,
  faUser,
  faCamera,
  faCarSide,
  faExclamationTriangle,
  faCheckCircle,
  faSpinner,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useApplication } from "@/contexts/ApplicationContext";
import {
  ApplicationSteps,
  LoadingSpinner,
} from "../components/ApplicationShared";

export default function ReviewPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { applicationData, setCurrentStep } = useApplication();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setCurrentStep(5);
  }, [setCurrentStep]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  const getLicenseTypeInfo = () => {
    switch (applicationData.licenseType) {
      case "car":
        return {
          name: "Private Car License (Class B)",
          price: "50,000 BIF",
          duration: "5 years",
        };
      case "motorcycle":
        return {
          name: "Motorcycle License (Class A)",
          price: "30,000 BIF",
          duration: "5 years",
        };
      case "commercial":
        return {
          name: "Commercial License (Class C)",
          price: "75,000 BIF",
          duration: "3 years",
        };
      default:
        return {
          name: "Unknown License Type",
          price: "N/A",
          duration: "N/A",
        };
    }
  };

  const licenseInfo = getLicenseTypeInfo();

  const handleEdit = (section: string) => {
    switch (section) {
      case "personal":
        router.push("/apply/personal-info");
        break;
      case "documents":
        router.push("/apply/documents");
        break;
      case "photo":
        router.push("/apply/photo");
        break;
      default:
        router.push("/apply");
    }
  };

  const handleSubmit = async () => {
    console.log("🚀 handleSubmit function called!");
    console.log("🔍 Current state:", {
      isSubmitting,
      submitError,
    });
    console.log("📋 Application data:", applicationData);

    setIsSubmitting(true);
    setSubmitError("");

    try {
      console.log("✅ Starting submission process...");

      // 1. Verify we're on the client side
      if (typeof window === "undefined") {
        throw new Error("This action can only be performed on the client side");
      }

      // 2. Get nationalId from application data
      const nationalId = applicationData.personalInfo?.nationalId;

      // 3. Generate application ID
      let applicationId = sessionStorage.getItem("applicationId");
      if (!applicationId) {
        applicationId = `APP-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;
        sessionStorage.setItem("applicationId", applicationId);
      }

      console.log("Generated application data:", {
        applicationId,
        nationalId,
      });

      // 4. Validate required fields
      if (!nationalId) {
        throw new Error(
          "Missing national ID. Please complete your personal information."
        );
      }

      if (!applicationData.licenseType || !applicationData.personalInfo) {
        throw new Error("Incomplete application data");
      }

      // 5. Store application data for payment processing
      const applicationForPayment = {
        applicationId,
        nationalId,
        licenseType: applicationData.licenseType,
        personalInfo: applicationData.personalInfo,
        documents: applicationData.documents,
        photo: applicationData.photo,
        licenseInfo,
        timestamp: new Date().toISOString(),
      };

      sessionStorage.setItem("pendingApplication", JSON.stringify(applicationForPayment));

      // 6. Navigate to payment page
      console.log("🎉 Validation successful! Navigating to payment page...");
      router.push("/apply/payment");

    } catch (error) {
      console.error("❌ Submission error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during submission";

      setSubmitError(errorMessage);

      // For network errors, suggest retrying
      if (errorMessage.toLowerCase().includes("network")) {
        setSubmitError(
          `${errorMessage}. Please check your connection and try again.`
        );
      }
    } finally {
      console.log("🔄 Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/apply/photo");
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationSteps currentStep={5} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-inter font-bold text-gray-900 mb-2">
              Review Your Application
            </h2>
            <p className="text-gray-600 font-inter">
              Please review all information before proceeding to payment.
              You can edit any section if needed.
            </p>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="w-5 h-5 text-red-600 mr-2"
                />
                <p className="text-red-700 font-inter">{submitError}</p>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* License Type Summary */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-inter font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon
                    icon={faCarSide}
                    className="w-5 h-5 mr-2 text-[#2C8E5D]"
                  />
                  License Type
                </h3>
                <button
                  onClick={() => handleEdit("license")}
                  className="text-[#2C8E5D] hover:text-[#245A47] font-inter text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
              <div className="bg-[#2C8E5D]/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-inter font-semibold text-gray-900">
                      {licenseInfo.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Valid for {licenseInfo.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-inter font-bold text-[#2C8E5D]">
                      {licenseInfo.price}
                    </p>
                    <p className="text-sm text-gray-500">Application fee</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-inter font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="w-5 h-5 mr-2 text-[#2C8E5D]"
                  />
                  Personal Information
                </h3>
                <button
                  onClick={() => handleEdit("personal")}
                  className="text-[#2C8E5D] hover:text-[#245A47] font-inter text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-gray-900">
                    {applicationData.personalInfo.firstName}{" "}
                    {applicationData.personalInfo.middleName}{" "}
                    {applicationData.personalInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Date of Birth
                  </p>
                  <p className="text-gray-900">
                    {applicationData.personalInfo.dateOfBirth}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    National ID
                  </p>
                  <p className="text-gray-900">
                    {applicationData.personalInfo.nationalId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Phone Number
                  </p>
                  <p className="text-gray-900">
                    {applicationData.personalInfo.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-900">
                    {applicationData.personalInfo.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-gray-900">
                    {applicationData.personalInfo.address?.street},{" "}
                    {applicationData.personalInfo.address?.zone},{" "}
                    {applicationData.personalInfo.address?.commune},{" "}
                    {applicationData.personalInfo.address?.province}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-inter font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon
                    icon={faFileAlt}
                    className="w-5 h-5 mr-2 text-[#2C8E5D]"
                  />
                  Uploaded Documents
                </h3>
                <button
                  onClick={() => handleEdit("documents")}
                  className="text-[#2C8E5D] hover:text-[#245A47] font-inter text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(applicationData.documents).map(
                  ([key, file]) => {
                    if (!file) return null;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                      >
                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="w-4 h-4 text-green-600 mr-2"
                          />
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              {key === "nationalId" && "National ID Card"}
                              {key === "medicalCertificate" &&
                                "Medical Certificate"}
                              {key === "drivingSchoolCertificate" &&
                                "Driving School Certificate"}
                              {key === "passportPhoto" && "Passport Photo"}
                              {key === "additionalDocuments" &&
                                "Additional Documents"}
                            </p>
                            <p className="text-xs text-green-700">
                              {file.name}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-green-600">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Photo & Signature */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-inter font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon
                    icon={faCamera}
                    className="w-5 h-5 mr-2 text-[#2C8E5D]"
                  />
                  Photo & Signature
                </h3>
                <button
                  onClick={() => handleEdit("photo")}
                  className="text-[#2C8E5D] hover:text-[#245A47] font-inter text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </p>
                  {applicationData.photo.profilePhoto ? (
                    <Image
                      src={applicationData.photo.profilePhoto}
                      alt="Profile"
                      width={128}
                      height={160}
                      className="w-32 h-40 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-40 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No photo</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Digital Signature
                  </p>
                  {applicationData.photo.signature ? (
                    <div className="w-64 h-24 border-2 border-gray-200 rounded-lg bg-white p-2">
                      <Image
                        src={applicationData.photo.signature}
                        alt="Signature"
                        width={256}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        No signature
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
                />
                <div>
                  <h4 className="font-inter font-medium text-yellow-800 mb-2">
                    Declaration
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    By proceeding to payment, I declare that:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                    <li>• All information provided is true and accurate</li>
                    <li>• All documents submitted are genuine and valid</li>
                    <li>
                      • I understand that providing false information is a
                      criminal offense
                    </li>
                    <li>
                      • I agree to abide by all traffic laws and regulations
                    </li>
                    <li>
                      • I understand the application fee is non-refundable
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-inter font-medium text-gray-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-8 py-3 bg-[#2C8E5D] hover:bg-[#245A47] text-white rounded-lg transition-all font-inter font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="w-4 h-4 animate-spin"
                    />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}