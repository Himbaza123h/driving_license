"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faArrowRight,
  faUpload,
  faFileAlt,
  faCheckCircle,
  faExclamationTriangle,
  faTrash,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useApplication, type DocumentInfo } from '@/contexts/ApplicationContext';
import { ApplicationSteps, LoadingSpinner } from '../components/ApplicationShared';

interface DocumentRequirement {
  key: keyof DocumentInfo;
  title: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number; // in MB
}

export default function DocumentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { applicationData, updateDocuments, setCurrentStep } = useApplication();

  const [uploadedFiles, setUploadedFiles] = useState<DocumentInfo>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  useEffect(() => {
    if (applicationData.documents) {
      setUploadedFiles(applicationData.documents);
    }
    setCurrentStep(3);
  }, [applicationData.documents, setCurrentStep]);

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
    router.push('/apply');
    return <LoadingSpinner message="Redirecting..." />;
  }
  const getDocumentRequirements = (): DocumentRequirement[] => {
    const baseRequirements: DocumentRequirement[] = [
      {
        key: 'nationalId',
        title: 'National ID Card',
        description: 'Clear copy of your national identification card (both sides)',
        required: true,
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5
      },
      {
        key: 'medicalCertificate',
        title: 'Medical Certificate',
        description: 'Medical fitness certificate from authorized healthcare provider (not older than 6 months)',
        required: true,
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5
      },
      {
        key: 'drivingSchoolCertificate',
        title: 'Driving School Certificate',
        description: 'Certificate of completion from authorized driving school',
        required: true,
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5
      },
      {
        key: 'passportPhoto',
        title: 'Passport Photo',
        description: 'Recent passport-sized photograph (white background)',
        required: true,
        acceptedFormats: ['JPG', 'PNG'],
        maxSize: 2
      }
    ];

    // Add additional requirements for commercial license
    if (applicationData.licenseType === 'commercial') {
      baseRequirements.push({
        key: 'additionalDocuments',
        title: 'Clean Driving Record',
        description: 'Official driving record certificate showing no major violations',
        required: true,
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5
      });
    }

    return baseRequirements;
  };

  const documentRequirements = getDocumentRequirements();

  const validateFile = (file: File, requirement: DocumentRequirement): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > requirement.maxSize) {
      return `File size must be less than ${requirement.maxSize}MB`;
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (!fileExtension || !requirement.acceptedFormats.includes(fileExtension)) {
      return `File must be in one of these formats: ${requirement.acceptedFormats.join(', ')}`;
    }

    return null;
  };

  const handleFileUpload = async (requirement: DocumentRequirement, file: File) => {
    const error = validateFile(file, requirement);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [requirement.key]: error
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({
      ...prev,
      [requirement.key]: ''
    }));

    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, [requirement.key]: 0 }));
    
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev[requirement.key] || 0;
        if (currentProgress >= 100) {
          clearInterval(uploadInterval);
          return prev;
        }
        return { ...prev, [requirement.key]: currentProgress + 10 };
      });
    }, 100);

    // Simulate upload completion after 1 second
    setTimeout(() => {
      clearInterval(uploadInterval);
      setUploadProgress(prev => ({ ...prev, [requirement.key]: 100 }));
      
      setUploadedFiles(prev => ({
        ...prev,
        [requirement.key]: file
      }));

      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[requirement.key];
          return newProgress;
        });
      }, 1000);
    }, 1000);
  };

  const handleFileInputChange = (requirement: DocumentRequirement, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(requirement, file);
    }
  };

  const removeFile = (key: keyof DocumentInfo) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[key];
      return newFiles;
    });
    
    // Clear the file input
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = '';
    }
  };

  const previewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  const validateAllDocuments = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    documentRequirements.forEach(requirement => {
      if (requirement.required && !uploadedFiles[requirement.key]) {
        newErrors[requirement.key] = 'This document is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateAllDocuments()) {
      updateDocuments(uploadedFiles);
      router.push('/apply/photo');
    }
  };

  const handleBack = () => {
    updateDocuments(uploadedFiles);
    router.push('/apply/personal-info');
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationSteps currentStep={3} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-inter font-bold text-gray-900 mb-2">
              Upload Required Documents
            </h2>
            <p className="text-gray-600 font-inter">
              Please upload clear, legible copies of all required documents. All documents must be current and valid.
            </p>
          </div>

          <div className="space-y-8">
            {documentRequirements.map((requirement) => {
              const file = uploadedFiles[requirement.key];
              const error = errors[requirement.key];
              const progress = uploadProgress[requirement.key];
              const isUploaded = !!file;

              return (
                <div key={requirement.key} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-inter font-semibold text-gray-900">
                          {requirement.title}
                        </h3>
                        {requirement.required && (
                          <span className="ml-2 text-red-500 text-sm">*</span>
                        )}
                        {isUploaded && (
                          <FontAwesomeIcon 
                            icon={faCheckCircle} 
                            className="ml-2 w-5 h-5 text-green-500" 
                          />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {requirement.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>Formats: {requirement.acceptedFormats.join(', ')}</span>
                        <span>Max size: {requirement.maxSize}MB</span>
                      </div>
                    </div>
                  </div>

                  {/* File Upload Area */}
                  {!isUploaded && progress === undefined && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        ref={(el) => {
                          if (el) fileInputRefs.current[requirement.key] = el;
                        }}
                        type="file"
                        accept={requirement.acceptedFormats.map(f => `.${f.toLowerCase()}`).join(',')}
                        onChange={(e) => handleFileInputChange(requirement, e)}
                        className="hidden"
                        id={`file-${requirement.key}`}
                      />
                      <label
                        htmlFor={`file-${requirement.key}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <FontAwesomeIcon icon={faUpload} className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-900 mb-1">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-gray-500">
                          {requirement.acceptedFormats.join(', ')} up to {requirement.maxSize}MB
                        </span>
                      </label>
                    </div>
                  )}                  {/* Upload Progress */}
                  {progress !== undefined && progress < 100 && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center mb-2">
                        <FontAwesomeIcon icon={faUpload} className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">Uploading...</span>
                      </div>                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className={`bg-blue-600 h-2 rounded-full transition-all duration-300 w-[${progress}%]`}
                        ></div>
                      </div>
                      <span className="text-xs text-blue-700 mt-1">{progress}%</span>
                    </div>
                  )}

                  {/* Uploaded File */}                  {isUploaded && (
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              {(file as File).name}
                            </p>
                            <p className="text-xs text-green-700">
                              {formatFileSize((file as File).size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => previewFile(file as File)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Preview file"
                          >
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFile(requirement.key)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remove file"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="mt-2 flex items-center text-red-600">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 mr-2" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Important Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h4 className="font-inter font-medium text-blue-800 mb-1">
                  Document Requirements
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• All documents must be clear and legible</li>
                  <li>• Medical certificate must be issued within the last 6 months</li>
                  <li>• Photos should have a white background</li>
                  <li>• Documents will be verified with issuing authorities</li>
                </ul>
              </div>
            </div>
          </div>

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
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-[#2C8E5D] hover:bg-[#245A47] text-white rounded-lg transition-all font-inter font-medium"
            >
              <span>Continue to Photo</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
