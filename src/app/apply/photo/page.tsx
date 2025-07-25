"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCamera,
  faRedo,
  faCheck,
  faExclamationTriangle,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useApplication, type PhotoInfo } from "@/contexts/ApplicationContext";
import {
  ApplicationSteps,
  LoadingSpinner,
} from "../components/ApplicationShared";

// Add these helper functions after validatePhotoAndSignature:
const saveToSessionStorage = (data: PhotoInfo) => {
  try {
    const sessionData = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem("photoData", JSON.stringify(sessionData));
    console.log("Saved to session storage:", sessionData);
  } catch (error) {
    console.error("Error saving to session storage:", error);
  }
};

const loadFromSessionStorage = () => {
  try {
    const savedData = sessionStorage.getItem("photoData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log("Loaded from session storage:", parsed);
      return parsed;
    }
  } catch (error) {
    console.error("Error loading from session storage:", error);
  }
  return null;
};

export default function PhotoPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { applicationData, updatePhoto, setCurrentStep } = useApplication();

  const [photoData, setPhotoData] = useState<PhotoInfo>(() => {
    // Initialize with session storage data if available
    if (typeof window !== "undefined") {
      const savedData = loadFromSessionStorage();
      if (savedData) {
        return savedData;
      }
    }
    return {};
  });

  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isCapturingSignature, setIsCapturingSignature] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const loadSessionData = () => {
      try {
        const savedPhotoData = loadFromSessionStorage();
        if (savedPhotoData) {
          setPhotoData(savedPhotoData);
          console.log(
            "Loaded photo data from session storage:",
            savedPhotoData
          );
        } else if (applicationData.photo) {
          setPhotoData(applicationData.photo);
          // Save to session storage if loading from application context
          saveToSessionStorage(applicationData.photo);
        }
      } catch (error) {
        console.error("Error loading session data:", error);
        if (applicationData.photo) {
          setPhotoData(applicationData.photo);
        }
      }
    };

    loadSessionData();
    setCurrentStep(4);
  }, [applicationData.photo, setCurrentStep]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  
  useEffect(() => {
  if (photoData.profilePhoto || photoData.signature) {
    saveToSessionStorage(photoData);
  }
}, [photoData]);

  useEffect(() => {
    if (photoData.profilePhoto || photoData.signature) {
      saveToSessionStorage(photoData);
    }
  }, [photoData]);

  // Show loading while checking authentication or redirecting
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return <LoadingSpinner message="Redirecting to sign in..." />;
  }

  // Redirect if no license type selected
  if (!applicationData.licenseType) {
    router.push("/apply");
    return <LoadingSpinner message="Redirecting..." />;
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturingPhoto(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setErrors((prev) => ({
        ...prev,
        camera:
          "Unable to access camera. Please check your camera permissions.",
      }));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturingPhoto(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPhotoData((prev) => ({
          ...prev,
          profilePhoto: photoDataUrl,
        }));

        stopCamera();

        // Clear any photo errors
        setErrors((prev) => ({
          ...prev,
          profilePhoto: "",
        }));
      }
    }
  };

  const retakePhoto = () => {
    setPhotoData((prev) => ({
      ...prev,
      profilePhoto: undefined,
    }));
    startCamera();
  };

  const uploadPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({
          ...prev,
          profilePhoto: "Photo size must be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          profilePhoto: "Please select a valid image file",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoData((prev) => ({
          ...prev,
          profilePhoto: result,
        }));

        // Clear any photo errors
        setErrors((prev) => ({
          ...prev,
          profilePhoto: "",
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startSignatureCapture = () => {
    setIsCapturingSignature(true);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = "black";
        context.lineWidth = 2;
        context.lineCap = "round";
      }
    }
  };

  const handleSignatureMouseDown = (event: React.MouseEvent) => {
    isDrawingRef.current = true;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const context = canvas.getContext("2d");
      if (context) {
        context.beginPath();
        context.moveTo(x, y);
      }
    }
  };

  const handleSignatureMouseMove = (event: React.MouseEvent) => {
    if (!isDrawingRef.current) return;

    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const context = canvas.getContext("2d");
      if (context) {
        context.lineTo(x, y);
        context.stroke();
      }
    }
  };

  const handleSignatureMouseUp = () => {
    isDrawingRef.current = false;
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const signatureDataUrl = canvas.toDataURL("image/png");
      setPhotoData((prev) => ({
        ...prev,
        signature: signatureDataUrl,
      }));
      setIsCapturingSignature(false);

      // Clear any signature errors
      setErrors((prev) => ({
        ...prev,
        signature: "",
      }));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const retakeSignature = () => {
    setPhotoData((prev) => ({
      ...prev,
      signature: undefined,
    }));
    startSignatureCapture();
  };

  const validatePhotoAndSignature = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!photoData.profilePhoto) {
      newErrors.profilePhoto = "Profile photo is required";
    }

    if (!photoData.signature) {
      newErrors.signature = "Signature is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add this new function after validatePhotoAndSignature:
const uploadPhotosToServer = async () => {
  try {
    if (!photoData.profilePhoto && !photoData.signature) {
      throw new Error("No photos to upload");
    }

    const formData = new FormData();
    
    // Get personalInfo from session storage
    const personalInfoData = sessionStorage.getItem("personalInfo");
    if (!personalInfoData) {
      throw new Error("Personal information not found in session storage");
    }
    
    const personalInfo = JSON.parse(personalInfoData);
    formData.append("nationalId", personalInfo.nationalId);
    formData.append("licenseType", applicationData.licenseType);

    // Convert base64 to blob and append files
    if (photoData.profilePhoto) {
      const photoBlob = await fetch(photoData.profilePhoto).then((r) =>
        r.blob()
      );
      formData.append("profilePhoto", photoBlob, "profile_photo.jpg");
    }

    if (photoData.signature) {
      const signatureBlob = await fetch(photoData.signature).then((r) =>
        r.blob()
      );
      formData.append("signature", signatureBlob, "signature.png");
    }

    const response = await fetch("/api/apply/photos", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to upload photos");
    }

    return result;
  } catch (error) {
    console.error("Error uploading photos:", error);
    throw error;
  }
};

  // const saveApplicationData = async () => {
  //   try {
  //     const applicationPayload = {
  //       licenseType: applicationData.licenseType,
  //       personalInfo: applicationData.personalInfo,
  //       documents: applicationData.documents,
  //       emergencyContact: applicationData.emergencyContact,
  //       photo: photoData,
  //     };

  //     console.log("=== FRONTEND: Sending application data ===");
  //     console.log(
  //       "Application payload:",
  //       JSON.stringify(applicationPayload, null, 2)
  //     );

  //     const response = await fetch("/api/license-applications", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(applicationPayload),
  //     });

  //     const result = await response.json();

  //     console.log("=== FRONTEND: API Response ===");
  //     console.log("Response status:", response.status);
  //     console.log("Response data:", JSON.stringify(result, null, 2));

  //     if (!response.ok) {
  //       throw new Error(result.error || "Failed to save application");
  //     }

  //     return result;
  //   } catch (error) {
  //     console.error("=== FRONTEND: Error saving application ===");
  //     console.error("Error:", error);
  //     const errorMessage =
  //       error instanceof Error ? error.message : "Unknown error occurred";
  //     throw new Error(errorMessage);
  //   }
  // };

  const handleNext = async () => {
    if (validatePhotoAndSignature()) {
      updatePhoto(photoData);

      try {
        setIsSubmitting(true);
        setErrors((prev) => ({ ...prev, saving: "" }));

        console.log("Starting photo upload...");

        // Upload photos to server - this now also sets status to submitted
        const uploadResult = await uploadPhotosToServer();
        console.log("Photos uploaded successfully:", uploadResult);

        if (uploadResult.success) {
          // Store the application ID and national ID in session storage
          const applicationId =
            uploadResult.applicationId || uploadResult.data?.applicationId;
          const nationalId = uploadResult.data?.nationalId;

          if (applicationId && nationalId) {
            sessionStorage.setItem("applicationId", applicationId);
            sessionStorage.setItem("nationalId", nationalId);
            console.log("Stored in session storage:", {
              applicationId,
              nationalId,
            });
          }

          // Clear photo data from session storage after successful upload
          sessionStorage.removeItem("photoData");

          // Navigate to review page
          router.push("/apply/review");
        } else {
          setErrors((prev) => ({
            ...prev,
            saving: uploadResult.error || "Failed to upload photos",
          }));
        }
      } catch (error) {
        console.error("Error in handleNext:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setErrors((prev) => ({
          ...prev,
          saving: errorMessage,
        }));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("Validation failed");
    }
  };



  // Updated handleSubmitApplication
  const handleSubmitApplication = async () => {
    await handleNext();
  };

  const handleBack = () => {
    updatePhoto(photoData);
    router.push("/apply/documents");
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationSteps currentStep={4} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-inter font-bold text-gray-900 mb-2">
              Photo & Signature
            </h2>
            <p className="text-gray-600 font-inter">
              Take or upload your license photo and provide your digital
              signature.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Photo Section */}
            <div>
              <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">
                Profile Photo *
              </h3>

              {!photoData.profilePhoto && !isCapturingPhoto && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FontAwesomeIcon
                      icon={faCamera}
                      className="w-12 h-12 text-gray-400 mb-4"
                    />
                    <p className="text-gray-600 mb-4">
                      Take a photo with your camera or upload an existing one
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={startCamera}
                        className="w-full bg-[#2C8E5D] text-white px-4 py-2 rounded-lg hover:bg-[#245A47] transition-all font-inter font-medium"
                      >
                        <FontAwesomeIcon icon={faCamera} className="mr-2" />
                        Take Photo{" "}
                      </button>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={uploadPhoto}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Upload photo file"
                          aria-label="Upload photo file"
                        />
                        <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all font-inter font-medium">
                          Upload Photo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isCapturingPhoto && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 border-4 border-white opacity-30 rounded-lg"></div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-[#2C8E5D] text-white px-4 py-2 rounded-lg hover:bg-[#245A47] transition-all font-inter font-medium"
                    >
                      <FontAwesomeIcon icon={faCamera} className="mr-2" />
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-inter font-medium text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {photoData.profilePhoto && (
                <div className="space-y-4">
                  {" "}
                  <div className="relative">
                    <Image
                      src={photoData.profilePhoto}
                      alt="Profile"
                      width={400}
                      height={256}
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={retakePhoto}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all font-inter font-medium"
                    >
                      <FontAwesomeIcon icon={faRedo} className="mr-2" />
                      Retake
                    </button>
                    <button
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-inter font-medium"
                      disabled
                    >
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Looks Good
                    </button>
                  </div>
                </div>
              )}

              {errors.profilePhoto && (
                <div className="mt-2 flex items-center text-red-600">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="w-4 h-4 mr-2"
                  />
                  <span className="text-sm">{errors.profilePhoto}</span>
                </div>
              )}

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-inter font-medium text-blue-800 mb-2">
                  Photo Guidelines
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use a plain white or light background</li>
                  <li>• Face the camera directly</li>
                  <li>• Remove glasses if possible</li>
                  <li>• Ensure good lighting</li>
                  <li>• No hats or head coverings (except religious)</li>
                </ul>
              </div>
            </div>

            {/* Signature Section */}
            <div>
              <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">
                Digital Signature *
              </h3>

              {!photoData.signature && !isCapturingSignature && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FontAwesomeIcon
                      icon={faPen}
                      className="w-12 h-12 text-gray-400 mb-4"
                    />
                    <p className="text-gray-600 mb-4">
                      Sign your name using your mouse or touchscreen
                    </p>
                    <button
                      onClick={startSignatureCapture}
                      className="w-full bg-[#2C8E5D] text-white px-4 py-2 rounded-lg hover:bg-[#245A47] transition-all font-inter font-medium"
                    >
                      <FontAwesomeIcon icon={faPen} className="mr-2" />
                      Start Signing
                    </button>
                  </div>
                </div>
              )}

              {isCapturingSignature && (
                <div className="space-y-4">
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                    <p className="text-sm text-gray-600 mb-2">
                      Sign in the box below:
                    </p>
                    <canvas
                      ref={signatureCanvasRef}
                      width={400}
                      height={200}
                      className="w-full h-48 border border-gray-200 rounded cursor-crosshair"
                      onMouseDown={handleSignatureMouseDown}
                      onMouseMove={handleSignatureMouseMove}
                      onMouseUp={handleSignatureMouseUp}
                      onMouseLeave={handleSignatureMouseUp}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={clearSignature}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-inter font-medium text-gray-700"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-2" />
                      Clear
                    </button>
                    <button
                      onClick={saveSignature}
                      className="flex-1 bg-[#2C8E5D] text-white px-4 py-2 rounded-lg hover:bg-[#245A47] transition-all font-inter font-medium"
                    >
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Save Signature
                    </button>
                  </div>
                </div>
              )}

              {photoData.signature && (
                <div className="space-y-4">
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    <Image
                      src={photoData.signature}
                      alt="Signature"
                      width={400}
                      height={192}
                      className="w-full h-48 object-contain"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={retakeSignature}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all font-inter font-medium"
                    >
                      <FontAwesomeIcon icon={faRedo} className="mr-2" />
                      Redo Signature
                    </button>
                    <button
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-inter font-medium"
                      disabled
                    >
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Looks Good
                    </button>
                  </div>
                </div>
              )}

              {errors.signature && (
                <div className="mt-2 flex items-center text-red-600">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="w-4 h-4 mr-2"
                  />
                  <span className="text-sm">{errors.signature}</span>
                </div>
              )}

              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-inter font-medium text-green-800 mb-2">
                  Signature Guidelines
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Sign your full legal name</li>
                  <li>• Use consistent signature style</li>
                  <li>• Make it clear and legible</li>
                  <li>• This will appear on your license</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Hidden canvases for photo capture */}
          <canvas ref={canvasRef} className="hidden" />

          {errors.saving && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-600">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="w-4 h-4 mr-2"
                />
                <span className="text-sm">{errors.saving}</span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-inter font-medium text-gray-700"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-[#2C8E5D] hover:bg-[#245A47] text-white rounded-lg transition-all font-inter font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2C8E5D]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading photos...</span>
                </>
              ) : (
                <>
                  <span>Save and review</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
