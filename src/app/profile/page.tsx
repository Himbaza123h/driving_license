"use client";
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faKey,
  faShield,
  faEdit,
  faSave,
  faTimes,
  faToggleOn,
  faToggleOff,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Define the permissions type
type PermissionKey =
  | "email"
  | "birthdate"
  | "gender"
  | "name"
  | "phoneNumber"
  | "picture";

type Permissions = {
  [K in PermissionKey]: boolean;
};

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [permissions, setPermissions] = useState<Permissions>({
    email: false,
    birthdate: false,
    gender: false,
    name: false,
    phoneNumber: false,
    picture: false,
  });
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState("");
  const [permissionsSuccess, setPermissionsSuccess] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  React.useEffect(() => {
    if (user?.nationalId) {
      fetchPermissions();
    } else {
      // Reset loading state if no nationalId
      setIsLoadingPermissions(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

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
  const fetchPermissions = async () => {
    if (!user?.nationalId) return;

    setIsLoadingPermissions(true);
    try {
      const response = await fetch(
        `/api/permissions?nationalId=${user.nationalId}`
      );
      const data = await response.json();

      if (data.success) {
        setPermissions(data.data.permissions);
      } else {
        // If no permissions found, keep default false values
        console.log("No permissions found, using defaults");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissionsError("Failed to load permissions");
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handlePermissionToggle = (permission: PermissionKey) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const handleSavePermissions = async () => {
    if (!user?.nationalId) {
      console.error("No national ID found for logged in user");
      setPermissionsError("National ID not found");
      return;
    }

    try {
      const response = await fetch("/api/permissions/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nationalId: user.nationalId,
          permissions: permissions,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPermissionsSuccess("Permissions updated successfully");
        setPermissionsError("");
        // Clear success message after 3 seconds
        setTimeout(() => setPermissionsSuccess(""), 3000);
      } else {
        setPermissionsError(data.error || "Failed to update permissions");
        setPermissionsSuccess("");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      setPermissionsError("Failed to update permissions");
      setPermissionsSuccess("");
    }
  };

  const handleSave = async () => {
    // Validate form data
    if (!formData.name.trim()) {
      setUpdateError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setUpdateError("Email is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setUpdateError("Please enter a valid email address");
      return;
    }

    if (!user?.id) {
      setUpdateError("User ID not found");
      return;
    }

    setIsUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUpdateSuccess("Profile updated successfully!");
        setIsEditing(false);

        // Update the user context if you have a method to do so
        // This depends on your AuthContext implementation
        // You might need to refresh the user data or update the context

        // Clear success message after 3 seconds
        setTimeout(() => setUpdateSuccess(""), 3000);
      } else {
        setUpdateError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateError("Network error. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium mb-4"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-inter font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-gray-600 font-inter mt-2">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-inter font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  {(updateError || updateSuccess) && (
                    <div
                      className={`mb-4 p-3 rounded-lg ${
                        updateSuccess
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-inter ${
                          updateSuccess ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {updateSuccess || updateError}
                      </p>
                    </div>
                  )}
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium"
                    >
                      <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="flex items-center space-x-2 bg-[#2C8E5D] hover:bg-[#245A47] disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-inter font-medium"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon
                              icon={faSave}
                              className="w-4 h-4"
                            />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-inter font-medium"
                      >
                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-[#2C8E5D] rounded-full flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="w-10 h-10 text-white"
                      />
                    </div>
                    <div>
                      <h3 className="font-inter font-medium text-gray-900">
                        Profile Picture
                      </h3>
                      <p className="font-inter text-sm text-gray-500 mb-2">
                        Upload a photo to personalize your account
                      </p>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-inter text-sm font-medium">
                        Upload Photo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent font-inter"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="w-5 h-5 text-gray-400"
                        />
                        <span className="font-inter text-gray-900">
                          {permissions.name
                            ? user.name
                            : "Sharing disabled - OFF"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Enter your email address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent font-inter"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <FontAwesomeIcon
                          icon={faEnvelope}
                          className="w-5 h-5 text-gray-400"
                        />
                        <span className="font-inter text-gray-900">
                          {permissions.email
                            ? user.email
                            : "Sharing disabled - OFF"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FontAwesomeIcon
                        icon={faShield}
                        className="w-5 h-5 text-gray-400"
                      />
                      <span className="font-inter text-gray-900 capitalize">
                        {user.provider === "google"
                          ? "Google Account"
                          : "Email Account"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h2 className="text-xl font-inter font-semibold text-gray-900 mb-6">
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon
                        icon={faKey}
                        className="w-5 h-5 text-gray-400"
                      />
                      <div>
                        <h3 className="font-inter font-medium text-gray-900">
                          Password
                        </h3>
                        <p className="font-inter text-sm text-gray-500">
                          Last updated 30 days ago
                        </p>
                      </div>
                    </div>
                    <button className="text-[#2C8E5D] hover:text-[#245A47] font-inter font-medium">
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon
                        icon={faShield}
                        className="w-5 h-5 text-gray-400"
                      />
                      <div>
                        <h3 className="font-inter font-medium text-gray-900">
                          Two-Factor Authentication
                        </h3>
                        <p className="font-inter text-sm text-gray-500">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <button className="bg-[#2C8E5D] hover:bg-[#245A47] text-white px-4 py-2 rounded-lg font-inter font-medium">
                      Enable
                    </button>
                  </div>
                </div>
              </div>

              {/* {sessionStorage.getItem("user_national_id") && ( */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <div className="mb-6">
                  <h2 className="text-xl font-inter font-semibold text-gray-900">
                    Data Privacy & Permissions
                  </h2>
                  <p className="text-sm text-gray-500 font-inter mt-1">
                    Control what information can be shared when verifying your
                    identity
                  </p>
                </div>

                {permissionsError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-inter">
                      {permissionsError}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {(
                    [
                      {
                        key: "email" as const,
                        label: "Email Address",
                        description:
                          "Allow sharing your email address for communication",
                      },
                      {
                        key: "name" as const,
                        label: "Full Name",
                        description:
                          "Allow sharing your full name during verification",
                      },
                      {
                        key: "birthdate" as const,
                        label: "Date of Birth",
                        description:
                          "Allow sharing your birth date for age verification",
                      },
                      {
                        key: "gender" as const,
                        label: "Gender",
                        description: "Allow sharing your gender information",
                      },
                      {
                        key: "phoneNumber" as const,
                        label: "Phone Number",
                        description:
                          "Allow sharing your phone number for contact",
                      },
                      {
                        key: "picture" as const,
                        label: "Profile Picture",
                        description:
                          "Allow sharing your profile picture for identification",
                      },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon
                          icon={
                            permissions[item.key] ? faToggleOn : faToggleOff
                          }
                          className={`w-6 h-6 ${
                            permissions[item.key]
                              ? "text-[#2C8E5D]"
                              : "text-gray-400"
                          }`}
                        />
                        <div>
                          <h3 className="font-inter font-medium text-gray-900">
                            {item.label}
                          </h3>
                          <p className="font-inter text-sm text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePermissionToggle(item.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          permissions[item.key] ? "bg-[#2C8E5D]" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions[item.key]
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {(permissionsSuccess || permissionsError) && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      permissionsSuccess
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-inter ${
                        permissionsSuccess ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {permissionsSuccess || permissionsError}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSavePermissions}
                    disabled={isLoadingPermissions}
                    className="bg-[#2C8E5D] hover:bg-[#245A47] disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-inter font-medium flex items-center space-x-2"
                  >
                    {isLoadingPermissions ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <FontAwesomeIcon
                      icon={faShield}
                      className="w-5 h-5 text-blue-600 mt-0.5"
                    />
                    <div>
                      <h4 className="font-inter font-medium text-blue-900">
                        Privacy Notice
                      </h4>
                      <p className="font-inter text-sm text-blue-700 mt-1">
                        These permissions only apply when you choose to share
                        your information during identity verification. Your data
                        is never shared without your explicit consent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-inter font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="font-inter text-gray-700">Dashboard</span>
                  </button>
                  <button
                    onClick={() => router.push("/apply")}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="font-inter text-gray-700">
                      Apply for License
                    </span>
                  </button>
                  <button
                    onClick={() => router.push("/verify")}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="font-inter text-gray-700">
                      Verify License
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-inter font-semibold text-blue-900 mb-2">
                  Need Help?
                </h3>
                <p className="font-inter text-sm text-blue-700 mb-4">
                  Contact our support team if you have any questions about your
                  account.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-inter font-medium text-sm">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
