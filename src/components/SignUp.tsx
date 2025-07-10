"use client";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faSpinner,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";

interface SignUpProps {
  onSwitchToSignIn: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitchToSignIn }) => {

  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nationalId: "",
    phoneNumber: "+257 ",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  // Validation functions
  const validateName = (name: string) => {
    if (!name) return { isValid: false, message: "" };
    if (name.length < 2)
      return { isValid: false, message: "Name must be at least 2 characters" };
    if (!/^[a-zA-Z\s]+$/.test(name))
      return {
        isValid: false,
        message: "Name can only contain letters and spaces",
      };
    return { isValid: true, message: "" };
  };

  const validateEmail = (email: string) => {
    if (!email) return { isValid: false, message: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return { isValid: false, message: "Please enter a valid email address" };
    return { isValid: true, message: "" };
  };

  const validateNationalId = (nationalId: string) => {
    if (!nationalId) return { isValid: false, message: "" };
    if (!/^[0-9]+$/.test(nationalId))
      return {
        isValid: false,
        message: "National ID must contain only numbers",
      };
    if (nationalId.length < 13)
      return {
        isValid: false,
        message: "National ID must be at least 13 digits",
      };
    if (nationalId.length > 16)
      return { isValid: false, message: "National ID cannot exceed 16 digits" };
    return { isValid: true, message: "" };
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === "+257 ")
      return { isValid: false, message: "" };
    const phoneRegex = /^\+257 [0-9]{2} [0-9]{3} [0-9]{3}$/;
    if (!phoneRegex.test(phoneNumber))
      return {
        isValid: false,
        message: "Phone number must be in format +257 XX XXX XXX",
      };
    return { isValid: true, message: "" };
  };

  const validatePassword = (password: string) => {
    if (!password) return { isValid: false, message: "" };
    if (password.length < 6)
      return {
        isValid: false,
        message: "Password must be at least 6 characters",
      };
    return { isValid: true, message: "" };
  };

  const validateConfirmPassword = (
    confirmPassword: string,
    password: string
  ) => {
    if (!confirmPassword) return { isValid: false, message: "" };
    if (confirmPassword !== password)
      return { isValid: false, message: "Passwords do not match" };
    return { isValid: true, message: "" };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      // Ensure the phone number always starts with +257
      if (!value.startsWith("+257 ")) {
        return; // Don't allow changes that remove the prefix
      }

      // Get the part after +257
      const afterPrefix = value.substring(5);

      // Remove any existing spaces and non-numeric characters
      const digitsOnly = afterPrefix.replace(/\D/g, "");

      // Format the digits with spaces: XX XXX XXX
      let formattedNumber = "+257 ";

      if (digitsOnly.length > 0) {
        // Add first 2 digits
        formattedNumber += digitsOnly.substring(0, 2);

        if (digitsOnly.length > 2) {
          // Add space and next 3 digits
          formattedNumber += " " + digitsOnly.substring(2, 5);

          if (digitsOnly.length > 5) {
            // Add space and last 3 digits
            formattedNumber += " " + digitsOnly.substring(5, 8);
          }
        }
      }

      // Only update if we haven't exceeded 8 digits (XX XXX XXX)
      if (digitsOnly.length <= 8) {
        setFormData((prev) => ({
          ...prev,
          [name]: formattedNumber,
        }));
      }

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneNumberKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;

    // Prevent deletion of the +257 prefix
    if ((e.key === "Backspace" || e.key === "Delete") && cursorPosition <= 5) {
      e.preventDefault();
    }

    // Only allow numbers, backspace, delete, and navigation keys
    if (
      !/[0-9]/.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  const validateForm = (): boolean => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.nationalId ||
      !formData.phoneNumber ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields");
      return false;
    }

    // Validate each field
    const nameValidation = validateName(formData.name);
    const emailValidation = validateEmail(formData.email);
    const nationalIdValidation = validateNationalId(formData.nationalId);
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    const passwordValidation = validatePassword(formData.password);
    const confirmPasswordValidation = validateConfirmPassword(
      formData.confirmPassword,
      formData.password
    );

    if (!nameValidation.isValid) {
      setError(nameValidation.message);
      return false;
    }

    if (!emailValidation.isValid) {
      setError(emailValidation.message);
      return false;
    }

    if (!nationalIdValidation.isValid) {
      setError(nationalIdValidation.message);
      return false;
    }

    if (!phoneValidation.isValid) {
      setError(phoneValidation.message);
      return false;
    }

    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return false;
    }

    if (!confirmPasswordValidation.isValid) {
      setError(confirmPasswordValidation.message);
      return false;
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log("Attempting to sign up..."); // Debug log
      await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.nationalId,
        formData.phoneNumber
      );
      console.log("Signup successful"); // Debug log

      setSuccess(
        "Account created successfully! Please check your email for verification."
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        nationalId: "",
        phoneNumber: "+257 ",
        password: "",
        confirmPassword: "",
      });
      setAcceptTerms(false);
      setTimeout(() => {
    router.push('/dashboard');
  }, 2000);
    } catch (error: unknown) {
      console.log("Signup error in component:", error); // Debug log

      // Handle different types of errors
      if (error instanceof Error) {
        console.log("Setting error message:", error.message); // Debug log
        setError(error.message);
      } else {
        console.log("Setting generic error message"); // Debug log
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length < 6) return { strength: "weak", color: "red" };
    if (password.length < 8) return { strength: "medium", color: "yellow" };
    return { strength: "strong", color: "green" };
  };

  const passwordStrength = getPasswordStrength();

  // Get validation status for each field
  const nameValidation = validateName(formData.name);
  const emailValidation = validateEmail(formData.email);
  const nationalIdValidation = validateNationalId(formData.nationalId);
  const phoneValidation = validatePhoneNumber(formData.phoneNumber);
  const passwordValidation = validatePassword(formData.password);
  const confirmPasswordValidation = validateConfirmPassword(
    formData.confirmPassword,
    formData.password
  );

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-inter font-bold text-gray-900 mb-2">
          Create your account
        </h2>
        <p className="text-gray-600 font-inter">
          Join DLV Burundi to access digital license services
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Full Name
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500 ${
                formData.name
                  ? nameValidation.isValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter your full name"
              disabled={isLoading}
              required
            />
            {formData.name && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FontAwesomeIcon
                  icon={nameValidation.isValid ? faCheck : faTimes}
                  className={`w-5 h-5 ${
                    nameValidation.isValid ? "text-green-500" : "text-red-500"
                  }`}
                />
              </div>
            )}
          </div>
          {formData.name && !nameValidation.isValid && (
            <p className="mt-1 text-sm text-red-600">
              {nameValidation.message}
            </p>
          )}
          {formData.name && nameValidation.isValid && (
            <p className="mt-1 text-sm text-green-600">✓ Valid name</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500 ${
                formData.email
                  ? emailValidation.isValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter your email"
              disabled={isLoading}
              required
            />
            {formData.email && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FontAwesomeIcon
                  icon={emailValidation.isValid ? faCheck : faTimes}
                  className={`w-5 h-5 ${
                    emailValidation.isValid ? "text-green-500" : "text-red-500"
                  }`}
                />
              </div>
            )}
          </div>
          {formData.email && !emailValidation.isValid && (
            <p className="mt-1 text-sm text-red-600">
              {emailValidation.message}
            </p>
          )}
          {formData.email && emailValidation.isValid && (
            <p className="mt-1 text-sm text-green-600">✓ Valid email address</p>
          )}
        </div>

        <div>
          <label
            htmlFor="nationalId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            National ID
          </label>
          <div className="relative">
            <input
              id="nationalId"
              name="nationalId"
              type="text"
              value={formData.nationalId}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500 ${
                formData.nationalId
                  ? nationalIdValidation.isValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter your National ID (13-16 digits)"
              disabled={isLoading}
              required
            />
            {formData.nationalId && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FontAwesomeIcon
                  icon={nationalIdValidation.isValid ? faCheck : faTimes}
                  className={`w-5 h-5 ${
                    nationalIdValidation.isValid
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
              </div>
            )}
          </div>
          {formData.nationalId && !nationalIdValidation.isValid && (
            <p className="mt-1 text-sm text-red-600">
              {nationalIdValidation.message}
            </p>
          )}
          {formData.nationalId && nationalIdValidation.isValid && (
            <p className="mt-1 text-sm text-green-600">
              ✓ Valid National ID ({formData.nationalId.length} digits)
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number
          </label>
          <div className="relative">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              onKeyDown={handlePhoneNumberKeyDown}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500 ${
                formData.phoneNumber && formData.phoneNumber !== "+257 "
                  ? phoneValidation.isValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="+257 XX XXX XXX"
              disabled={isLoading}
              required
            />
            {formData.phoneNumber && formData.phoneNumber !== "+257 " && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FontAwesomeIcon
                  icon={phoneValidation.isValid ? faCheck : faTimes}
                  className={`w-5 h-5 ${
                    phoneValidation.isValid ? "text-green-500" : "text-red-500"
                  }`}
                />
              </div>
            )}
          </div>
          {formData.phoneNumber &&
            formData.phoneNumber !== "+257 " &&
            !phoneValidation.isValid && (
              <p className="mt-1 text-sm text-red-600">
                {phoneValidation.message}
              </p>
            )}
          {formData.phoneNumber && phoneValidation.isValid && (
            <p className="mt-1 text-sm text-green-600">✓ Valid phone number</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500 ${
                formData.password
                  ? passwordValidation.isValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Create a password"
              disabled={isLoading}
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {formData.password && (
                <FontAwesomeIcon
                  icon={passwordValidation.isValid ? faCheck : faTimes}
                  className={`w-5 h-5 ${
                    passwordValidation.isValid
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
          {formData.password && !passwordValidation.isValid && (
            <p className="mt-1 text-sm text-red-600">
              {passwordValidation.message}
            </p>
          )}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.color === "red"
                        ? "bg-red-500 w-1/3"
                        : passwordStrength.color === "yellow"
                        ? "bg-yellow-500 w-2/3"
                        : "bg-green-500 w-full"
                    }`}
                  />
                </div>
                <span
                  className={`text-sm font-medium capitalize ${
                    passwordStrength.color === "red"
                      ? "text-red-600"
                      : passwordStrength.color === "yellow"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {passwordStrength.strength}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-transparent transition-all duration-200 font-inter text-gray-900 placeholder-gray-500 ${
                formData.confirmPassword
                  ? confirmPasswordValidation.isValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Confirm your password"
              disabled={isLoading}
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {formData.confirmPassword && (
                <FontAwesomeIcon
                  icon={confirmPasswordValidation.isValid ? faCheck : faTimes}
                  className={`w-5 h-5 ${
                    confirmPasswordValidation.isValid
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon
                  icon={showConfirmPassword ? faEyeSlash : faEye}
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
          {formData.confirmPassword && !confirmPasswordValidation.isValid && (
            <p className="mt-1 text-sm text-red-600">
              {confirmPasswordValidation.message}
            </p>
          )}
          {formData.confirmPassword && confirmPasswordValidation.isValid && (
            <p className="mt-1 text-sm text-green-600">✓ Passwords match</p>
          )}
        </div>

        <div className="flex items-start">
          <input
            id="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="w-4 h-4 text-[#2C8E5D] border-gray-300 rounded focus:ring-[#2C8E5D] mt-1"
            disabled={isLoading}
          />
          <label
            htmlFor="acceptTerms"
            className="ml-3 text-sm text-gray-600 font-inter"
          >
            I agree to the{" "}
            <a
              href="#"
              className="text-[#2C8E5D] hover:text-[#245A47] font-medium"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-[#2C8E5D] hover:text-[#245A47] font-medium"
            >
              Privacy Policy
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2C8E5D] hover:bg-[#245A47] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon
                icon={faSpinner}
                className="w-5 h-5 animate-spin"
              />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 font-inter">
          Already have an account?{" "}
          <button
            onClick={onSwitchToSignIn}
            className="text-[#2C8E5D] hover:text-[#245A47] font-medium"
            disabled={isLoading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
