"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faUser,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faExclamationTriangle,
  faDownload,
  faArrowLeft,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faIdCard,
  faCalendarAlt,
  faFlag,
  faPaperclip,
  faUserFriends,
  faQrcode,
  faExpand,
  faTimes,
  faCheck,
  faSpinner,
  faFingerprint,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "@/contexts/AuthContext";

// Type definitions
interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  gender: string;
  phoneNumber: string;
  email: string;
  address: {
    province: string;
    commune: string;
    zone: string;
    street: string;
  };
}

interface EmergencyContact {
  name: string;
  phoneNumber: string;
  relationship: string;
}

interface QRCodeData {
  licenseNumber: string;
  qrCodeImage: string;
  issueDate: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
  qrData: {
    holderName: string;
    nationalId: string;
    licenseType: string;
    issueDate: string;
    expiryDate: string;
    status: string;
  };
}

interface ApplicationDetails {
  id: string;
  citizenId: string;
  licenseType: string;
  status: string;
  personalInfo: PersonalInfo;
  documents: {
    passportPhoto?: {
      fileName: string;
      filePath: string;
      fileSize: number;
      uploadedAt: string;
    };
    medicalCertificate?: {
      fileName: string;
      filePath: string;
      fileSize: number;
      uploadedAt: string;
    };
    additionalDocuments?: {
      fileName: string;
      filePath: string;
      fileSize: number;
      uploadedAt: string;
    };
    drivingSchoolCertificate?: {
      fileName: string;
      filePath: string;
      fileSize: number;
      uploadedAt: string;
    };
  };
  emergencyContact: EmergencyContact;
  photos: {
    profilePhoto?: {
      fileName: string;
      filePath: string;
      fileSize: number;
      uploadedAt: string;
    };
    signature?: {
      fileName: string;
      filePath: string;
      fileSize: number;
      uploadedAt: string;
    };
  };
  reviewNotes?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  pickedUp?: boolean;
  pickupTime?: string;
  licenseNumber?: string;
  qrCode?: QRCodeData;
}

interface ApiResponse {
  success: boolean;
  data: ApplicationDetails;
  error?: string;
}

type ApplicationStatus =
  | "approved"
  | "rejected"
  | "pending"
  | "submitted"
  | "under_review";

const ApplicationDetailsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<ApplicationDetails | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [processingAction, setProcessingAction] = useState<string>("");

  const [showPickupModal, setShowPickupModal] = useState<boolean>(false);
  const [processingPickup, setProcessingPickup] = useState<boolean>(false);
  const [pickupStatus, setPickupStatus] = useState<string>("");
  const [fingerprintError, setFingerprintError] = useState<string>("");

  const isAdmin = user?.roles === "admin";
  const isUser = user?.roles === "user";

  useEffect(() => {
    if (applicationId && user?.nationalId) {
      fetchApplicationDetails();
    }
  }, [applicationId, user]);

  const fetchApplicationDetails = async (): Promise<void> => {
    if (!applicationId || !user?.nationalId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/applications/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          citizenId: user.nationalId,
        }),
      });

      const data: ApiResponse = await response.json();
      

      if (data.success) {
        setApplication(data.data);
      } else {
        setError(data.error || "Failed to fetch application details");
      }
    } catch (err) {
      console.error("Error fetching application details:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (): Promise<void> => {
    if (!application || !reviewAction) return;

    setProcessingAction(reviewAction); // Set to specific action
    setError("");

    try {
      const response = await fetch("/api/admin/applications/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: application.id,
          action: reviewAction === "approve" ? "APPROVED" : "REJECTED",
          reviewNotes: reviewNotes.trim() || undefined,
          adminId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the application state with the new data
        setApplication((prev) => (prev ? { ...prev, ...data.data } : null));
        setShowReviewModal(false);
        setReviewAction(null);
        setReviewNotes("");

        // Show success message
        // You might want to add a toast notification here
      } else {
        setError(data.error || `Failed to ${reviewAction} application`);
      }
    } catch (err) {
      console.error(`Error ${reviewAction}ing application:`, err);
      setError(`Network error. Failed to ${reviewAction} application.`);
    } finally {
      setProcessingAction(""); // Reset to empty string
    }
  };

  const handleConfirmPickup = async (): Promise<void> => {
    if (!application) return;

    setProcessingPickup(true);
    setFingerprintError("");
    setPickupStatus("verifying");

    try {
      // Simulate fingerprint verification delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful verification
      setPickupStatus("success");

      // Call API to record pickup
      const response = await fetch("/api/admin/applications/confirm-pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: application.id,
          citizenId: user?.nationalId,
          pickupTime: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the application state with pickup info
        setApplication((prev) => (prev ? { ...prev, ...data.data } : null));

        // Close modal after 2 seconds
        setTimeout(() => {
          setShowPickupModal(false);
          setPickupStatus("");
        }, 2000);
      } else {
        setFingerprintError(data.error || "Failed to confirm pickup");
        setPickupStatus("");
      }
    } catch (error: unknown) {
      console.error("Pickup confirmation failed:", error);
      // const errorMessage =
      //   error instanceof Error ? error.message : "Unknown error occurred";
      setFingerprintError("Failed to confirm pickup. Please try again.");
      setPickupStatus("");
    } finally {
      setProcessingPickup(false);
    }
  };

  const shouldShowPickupButton = (): boolean => {
    if (!application) return false;

    const isApproved = application.status?.toLowerCase() === "approved";
    const hasPermission = isAdmin || isUser;
    const notPickedUp = !application.pickedUp; // Note: use pickedUp, not picked_up

    return isApproved && hasPermission && notPickedUp;
  };

  const openReviewModal = (action: "approve" | "reject") => {
    setReviewAction(action);
    setReviewNotes("");
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewAction(null);
    setReviewNotes("");
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase() as ApplicationStatus) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "under_review":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase() as ApplicationStatus) {
      case "approved":
        return faCheckCircle;
      case "rejected":
        return faTimesCircle;
      case "pending":
      case "submitted":
        return faClock;
      case "under_review":
        return faExclamationTriangle;
      default:
        return faFileAlt;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSimpleDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLicenseTypeLabel = (type: string): string => {
    switch (type) {
      case "car":
        return "Private Car License (Class B)";
      case "motorcycle":
        return "Motorcycle License (Class A)";
      case "commercial":
        return "Commercial License (Class C)";
      case "category_a":
        return "Category A (Motorcycles)";
      case "category_b":
        return "Category B (Cars)";
      case "category_c":
        return "Category C (Trucks)";
      case "category_d":
        return "Category D (Buses)";
      default:
        return type?.replace("_", " ").toUpperCase() || "Unknown";
    }
  };



  const downloadQRCode = (): void => {
    if (!application?.qrCode?.qrCodeImage) return;

    const link = document.createElement("a");
    link.href = application.qrCode.qrCodeImage;
    link.download = `license-qr-${
      application.licenseNumber || application.id
    }.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if QR code should be visible
  const shouldShowQRCode = () => {
    if (!application?.qrCode) return false;

    // Admin can always see QR code
    if (isAdmin) return true;

    // User can only see QR code if application is approved
    if (isUser && application.status?.toLowerCase() === "approved") return true;

    return false;
  };

  // Check if admin actions should be visible
  const shouldShowAdminActions = () => {
    if (!isAdmin || !application) return false;

    const status = application.status?.toLowerCase();
    return status !== "approved" && status !== "rejected";
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C8E5D] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-inter">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, let ConditionalLayout handle the redirect
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium mb-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5 mr-2" />
              Back to Applications
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-inter font-bold text-gray-900">
                  Application Details
                </h1>
                <p className="text-gray-600 font-inter mt-2">
                  View detailed information about {isAdmin ? "the" : "your"}{" "}
                  license application
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-inter">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C8E5D] mx-auto"></div>
                <p className="mt-4 text-gray-600 font-inter">
                  Loading application details...
                </p>
              </div>
            </div>
          ) : application ? (
            <div className="space-y-6">
              {/* Application Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#2C8E5D] rounded-full flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faFileAlt}
                        className="w-6 h-6 text-white"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-inter font-semibold text-gray-900">
                        {getLicenseTypeLabel(application.licenseType)}
                      </h2>
                      <p className="text-gray-500 font-inter">
                        Application ID: {application.id}
                      </p>
                      {application.licenseNumber && (
                        <p className="text-gray-500 font-inter">
                          License Number: {application.licenseNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        application.status
                      )}`}
                    >
                      <FontAwesomeIcon
                        icon={getStatusIcon(application.status)}
                        className="w-4 h-4 mr-2"
                      />
                      {application.status?.replace("_", " ").toUpperCase()}
                    </span>

                    {/* Admin Actions */}
                    {shouldShowAdminActions() && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openReviewModal("approve")}
                          disabled={processingAction !== ""}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-inter font-medium"
                        >
                          {processingAction === "approve" ? (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="w-4 h-4 animate-spin"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="w-4 h-4"
                            />
                          )}
                          <span>
                            {processingAction === "approve"
                              ? "Approving..."
                              : "Approve"}
                          </span>
                        </button>
                        <button
                          onClick={() => openReviewModal("reject")}
                          disabled={processingAction !== ""}
                          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-inter font-medium"
                        >
                          {processingAction === "reject" ? (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="w-4 h-4 animate-spin"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faTimes}
                              className="w-4 h-4"
                            />
                          )}
                          <span>
                            {processingAction === "reject"
                              ? "Rejecting..."
                              : "Reject"}
                          </span>
                        </button>
                      </div>
                    )}
                    {/* {application.status === "approved" && ( */}
                    <div className="flex items-center space-x-2">

                      {/* Confirm Pickup Button */}
                      {shouldShowPickupButton() && (
                        <button
                          onClick={() => setShowPickupModal(true)}
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-inter font-medium"
                        >
                          <FontAwesomeIcon
                            icon={faFingerprint}
                            className="w-4 h-4"
                          />
                          <span>Verify & Confirm Pickup</span>
                        </button>
                      )}
                    </div>
                    {/* )} */}
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                      <div className={`text-sm font-inter ${application.pickedUp ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
    {application.pickedUp ? "Picked up at" : "Submitted at"}
  </div>
                    <div className="text-lg font-inter font-semibold text-gray-900">
                      {application.pickedUp
                        ? formatDate(application.pickupTime || "")
                        : formatDate(application.submittedAt)}
                    </div>
                  </div>
                  {application.approvedAt && (
                    <div className="text-center">
                      <div className="text-sm text-gray-500 font-inter">
                        Approved
                      </div>
                      <div className="text-lg font-inter font-semibold text-green-600">
                        {formatDate(application.approvedAt)}
                      </div>
                    </div>
                  )}
                  {application.rejectedAt && (
                    <div className="text-center">
                      <div className="text-sm text-gray-500 font-inter">
                        Rejected
                      </div>
                      <div className="text-lg font-inter font-semibold text-red-600">
                        {formatDate(application.rejectedAt)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Notes */}
                {application.reviewNotes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-inter font-semibold text-gray-900 mb-2">
                      Review Notes
                    </h3>
                    <p className="text-gray-700 font-inter">
                      {application.reviewNotes}
                    </p>
                  </div>
                )}
              </div>

              {showReviewModal && reviewAction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-md w-full p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {reviewAction === "approve" ? "Approve" : "Reject"}{" "}
                        Application
                      </h3>
                      <button
                        onClick={closeReviewModal}
                        disabled={processingAction !== ""}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-600 font-inter mb-4">
                        Are you sure you want to {reviewAction} this
                        application?
                      </p>

                      <div>
                        <label className="block text-sm font-inter font-medium text-gray-700 mb-2">
                          Review Notes{" "}
                          {reviewAction === "reject"
                            ? "(Required)"
                            : "(Optional)"}
                        </label>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder={`Add ${
                            reviewAction === "reject"
                              ? "reason for rejection"
                              : "approval notes"
                          }...`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent font-inter"
                          rows={4}
                          disabled={processingAction !== ""}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={closeReviewModal}
                        disabled={processingAction !== ""}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-lg font-inter font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApproveReject}
                        disabled={
                          processingAction !== "" ||
                          (reviewAction === "reject" && !reviewNotes.trim())
                        }
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-inter font-medium text-white disabled:cursor-not-allowed ${
                          reviewAction === "approve"
                            ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                            : "bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                        }`}
                      >
                        {processingAction === reviewAction ? (
                          <FontAwesomeIcon
                            icon={faSpinner}
                            className="w-4 h-4 animate-spin"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={
                              reviewAction === "approve" ? faCheck : faTimes
                            }
                            className="w-4 h-4"
                          />
                        )}
                        <span>
                          {processingAction === reviewAction
                            ? `${
                                reviewAction === "approve"
                                  ? "Approving"
                                  : "Rejecting"
                              }...`
                            : `${
                                reviewAction === "approve"
                                  ? "Approve"
                                  : "Reject"
                              }`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Modal */}
              {showPickupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon
                          icon={faFingerprint}
                          className="w-8 h-8 text-blue-600"
                        />
                      </div>

                      <h3 className="text-xl font-inter font-semibold text-gray-900 mb-2">
                        Verify Identity
                      </h3>

                      {pickupStatus === "" && (
                        <>
                          <p className="text-gray-600 font-inter mb-6">
                            Please verify your identity to confirm license
                            pickup
                          </p>
                          <div className="space-y-3">
                            <button
                              onClick={handleConfirmPickup}
                              disabled={processingPickup}
                              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-inter font-medium"
                            >
                              {processingPickup ? (
                                <FontAwesomeIcon
                                  icon={faSpinner}
                                  className="w-5 h-5 animate-spin"
                                />
                              ) : (
                                <FontAwesomeIcon
                                  icon={faFingerprint}
                                  className="w-5 h-5"
                                />
                              )}
                              <span>
                                {processingPickup
                                  ? "Verifying..."
                                  : "Verify Fingerprint"}
                              </span>
                            </button>

                            <button
                              onClick={() => setShowPickupModal(false)}
                              className="w-full text-gray-500 hover:text-gray-700 font-inter font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}

                      {pickupStatus === "verifying" && (
                        <div className="text-center">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <FontAwesomeIcon
                              icon={faFingerprint}
                              className="w-10 h-10 text-blue-600"
                            />
                          </div>
                          <p className="text-gray-600 font-inter">
                            Verifying fingerprint...
                          </p>
                        </div>
                      )}

                      {pickupStatus === "success" && (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="w-8 h-8 text-green-600"
                            />
                          </div>
                          <p className="text-green-600 font-inter font-semibold">
                            Verification Successful!
                          </p>
                          <p className="text-gray-600 font-inter text-sm mt-1">
                            License pickup confirmed
                          </p>
                        </div>
                      )}

                      {fingerprintError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 font-inter">
                            {fingerprintError}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Section - Only show if conditions are met */}
              {shouldShowQRCode() && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4 flex items-center">
                    <FontAwesomeIcon
                      icon={faQrcode}
                      className="w-5 h-5 mr-2 text-[#2C8E5D]"
                    />
                    Digital License QR Code
                    {isAdmin &&
                      application.status?.toLowerCase() !== "approved" && (
                        <span className="ml-2 text-sm text-orange-600 font-normal">
                          (Admin Preview)
                        </span>
                      )}
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* QR Code Image */}
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                        <img
                          src={application.qrCode.qrCodeImage}
                          alt="License QR Code"
                          className="w-48 h-48 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setShowQRModal(true)}
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowQRModal(true)}
                          className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-inter font-medium"
                        >
                          <FontAwesomeIcon
                            icon={faExpand}
                            className="w-4 h-4"
                          />
                          <span>View Full Size</span>
                        </button>
                        <button
                          onClick={downloadQRCode}
                          className="flex items-center space-x-2 bg-[#2C8E5D] hover:bg-[#245A47] text-white px-4 py-2 rounded-lg font-inter font-medium"
                        >
                          <FontAwesomeIcon
                            icon={faDownload}
                            className="w-4 h-4"
                          />
                          <span>Download QR</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Code Information */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-inter font-medium text-gray-500">
                          License Number
                        </label>
                        <p className="text-lg font-inter font-semibold text-gray-900">
                          {application.qrCode.licenseNumber}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-inter font-medium text-gray-500">
                          Holder Name
                        </label>
                        <p className="text-gray-900 font-inter">
                          {application.qrCode.qrData.holderName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-inter font-medium text-gray-500">
                          National ID
                        </label>
                        <p className="text-gray-900 font-inter">
                          {application.qrCode.qrData.nationalId}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-inter font-medium text-gray-500">
                          License Type
                        </label>
                        <p className="text-gray-900 font-inter">
                          {getLicenseTypeLabel(
                            application.qrCode.qrData.licenseType
                          )}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-inter font-medium text-gray-500">
                            Issue Date
                          </label>
                          <p className="text-gray-900 font-inter">
                            {formatSimpleDate(
                              application.qrCode.qrData.issueDate
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-inter font-medium text-gray-500">
                            Expiry Date
                          </label>
                          <p className="text-gray-900 font-inter">
                            {formatSimpleDate(
                              application.qrCode.qrData.expiryDate
                            )}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-inter font-medium text-gray-500">
                          Status
                        </label>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            application.qrCode.qrData.status
                          )}`}
                        >
                          {application.qrCode.qrData.status
                            ?.replace("_", " ")
                            .toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Usage Instructions */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-inter font-semibold text-blue-900 mb-2">
                      How to use your Digital License QR Code:
                    </h4>
                    <ul className="text-sm text-blue-800 font-inter space-y-1">
                      <li>
                        • Present this QR code to authorities for instant
                        license verification
                      </li>
                      <li>
                        • The QR code contains encrypted license information for
                        security
                      </li>
                      <li>
                        • Download and save the QR code image to your mobile
                        device
                      </li>
                      <li>• Always carry your physical license as backup</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="w-5 h-5 mr-2 text-[#2C8E5D]"
                  />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        Full Name
                      </label>
                      <p className="text-gray-900 font-inter">
                        {application.personalInfo.firstName}{" "}
                        {application.personalInfo.middleName}{" "}
                        {application.personalInfo.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        <FontAwesomeIcon
                          icon={faIdCard}
                          className="w-4 h-4 mr-1"
                        />
                        National ID
                      </label>
                      <p className="text-gray-900 font-inter">
                        {application.personalInfo.nationalId}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        <FontAwesomeIcon
                          icon={faCalendarAlt}
                          className="w-4 h-4 mr-1"
                        />
                        Date of Birth
                      </label>
                      <p className="text-gray-900 font-inter">
                        {formatDate(application.personalInfo.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        Place of Birth
                      </label>
                      <p className="text-gray-900 font-inter">
                        {application.personalInfo.placeOfBirth}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        <FontAwesomeIcon
                          icon={faFlag}
                          className="w-4 h-4 mr-1"
                        />
                        Nationality
                      </label>
                      <p className="text-gray-900 font-inter">
                        {application.personalInfo.nationality}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        Gender
                      </label>
                      <p className="text-gray-900 font-inter">
                        {application.personalInfo.gender}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        <FontAwesomeIcon
                          icon={faPhone}
                          className="w-4 h-4 mr-1"
                        />
                        Phone Number
                      </label>
                      <p className="text-gray-900 font-inter">
                        {application.personalInfo.phoneNumber}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        <FontAwesomeIcon
                          icon={faEnvelope}
                          className="w-4 h-4 mr-1"
                        />
                        Email
                      </label>
                      <p className="text-gray-900 font-inter">
                        {application.personalInfo.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-inter font-medium text-gray-500">
                        <FontAwesomeIcon
                          icon={faMapMarkerAlt}
                          className="w-4 h-4 mr-1"
                        />
                        Address
                      </label>
                      <p className="text-gray-900 font-inter">
                        {application.personalInfo.address.street},{" "}
                        {application.personalInfo.address.zone},{" "}
                        {application.personalInfo.address.commune},{" "}
                        {application.personalInfo.address.province}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Emergency Contact */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon
                    icon={faUserFriends}
                    className="w-5 h-5 mr-2 text-[#2C8E5D]"
                  />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-inter font-medium text-gray-500">
                      Name
                    </label>
                    <p className="text-gray-900 font-inter">
                      {application.emergencyContact.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-inter font-medium text-gray-500">
                      Phone Number
                    </label>
                    <p className="text-gray-900 font-inter">
                      {application.emergencyContact.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-inter font-medium text-gray-500">
                      Relationship
                    </label>
                    <p className="text-gray-900 font-inter">
                      {application.emergencyContact.relationship}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {application.documents &&
                Object.keys(application.documents).length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4 flex items-center">
                      <FontAwesomeIcon
                        icon={faPaperclip}
                        className="w-5 h-5 mr-2 text-[#2C8E5D]"
                      />
                      Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(application.documents).map(
                        ([key, doc]) => {
                          const isImage = doc.fileName.match(
                            /\.(jpg|jpeg|png|gif|bmp|webp)$/i
                          );

                          return (
                            <div
                              key={key}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start space-x-3">
                                {isImage ? (
                                  <div
                                    className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                                    onClick={() =>
                                      window.open(doc.filePath, "_blank")
                                    }
                                  >
                                    <img
                                      src={doc.filePath}
                                      alt={key}
                                      className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        e.currentTarget.nextSibling.style.display =
                                          "flex";
                                      }}
                                    />
                                    <FontAwesomeIcon
                                      icon={faFileAlt}
                                      className="w-6 h-6 text-gray-400"
                                      style={{ display: "none" }}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() =>
                                      window.open(doc.filePath, "_blank")
                                    }
                                  >
                                    <FontAwesomeIcon
                                      icon={faFileAlt}
                                      className="w-6 h-6 text-gray-400"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="font-inter font-medium text-gray-900 cursor-pointer hover:text-[#2C8E5D] transition-colors truncate"
                                    onClick={() =>
                                      window.open(doc.filePath, "_blank")
                                    }
                                  >
                                    {doc.fileName}
                                  </p>
                                  <p className="text-sm text-gray-500 font-inter">
                                    {key
                                      .replace(/([A-Z])/g, " $1")
                                      .replace(/^./, (str) =>
                                        str.toUpperCase()
                                      )}
                                  </p>
                                  <p className="text-xs text-gray-400 font-inter">
                                    {(doc.fileSize / 1024).toFixed(1)} KB
                                  </p>
                                  {isImage && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                      <FontAwesomeIcon
                                        icon={faExpand}
                                        className="w-3 h-3 mr-1"
                                      />
                                      Click image to view
                                    </span>
                                  )}
                                  {!isImage && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                      <FontAwesomeIcon
                                        icon={faDownload}
                                        className="w-3 h-3 mr-1"
                                      />
                                      Click to open
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Photos */}
              {application.photos &&
                Object.keys(application.photos).length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4 flex items-center">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="w-5 h-5 mr-2 text-[#2C8E5D]"
                      />
                      Photos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(application.photos).map(
                        ([key, photo]) => (
                          <div
                            key={key}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photo.filePath}
                                  alt={key}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextSibling.style.display =
                                      "flex";
                                  }}
                                />
                                <FontAwesomeIcon
                                  icon={faUser}
                                  className="w-6 h-6 text-gray-400"
                                  style={{ display: "none" }}
                                />
                              </div>
                              <div>
                                <p className="font-inter font-medium text-gray-900">
                                  {photo.fileName}
                                </p>
                                <p className="text-sm text-gray-500 font-inter">
                                  {key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (str) => str.toUpperCase())}
                                </p>
                                <p className="text-xs text-gray-400 font-inter">
                                  {(photo.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FontAwesomeIcon
                icon={faFileAlt}
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
              />
              <h3 className="text-lg font-inter font-semibold text-gray-900 mb-2">
                Application Not Found
              </h3>
              <p className="text-gray-600 font-inter">
                The requested application could not be found or you dont have
                permission to view it.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && application?.qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-inter font-semibold text-gray-900">
                Digital License QR Code
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 inline-block">
                <img
                  src={application.qrCode.qrCodeImage}
                  alt="License QR Code"
                  className="w-64 h-64"
                />
              </div>

              <div className="text-sm text-gray-600 font-inter mb-4">
                <p className="font-medium">
                  License: {application.qrCode.licenseNumber}
                </p>
                <p>Holder: {application.qrCode.qrData.holderName}</p>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center space-x-2 bg-[#2C8E5D] hover:bg-[#245A47] text-white px-4 py-2 rounded-lg font-inter font-medium"
                >
                  <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-inter font-medium"
                >
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailsPage;
