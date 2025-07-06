"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  nationality: string;
  nationalId: string;
  phoneNumber: string;
  email: string;
  address: {
    province: string;
    commune: string;
    zone: string;
    street: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}

export interface DocumentInfo {
  nationalId?: File;
  medicalCertificate?: File;
  drivingSchoolCertificate?: File;
  passportPhoto?: File;
  additionalDocuments?: File[];
}

export interface PhotoInfo {
  profilePhoto?: string; // Base64 string
  signature?: string; // Base64 string
}

export interface ApplicationData {
  licenseType: string;
  personalInfo: Partial<PersonalInfo>;
  documents: DocumentInfo;
  photo: PhotoInfo;
  currentStep: number;
  isSubmitted: boolean;
  applicationId?: string;
}

interface ApplicationContextType {
  applicationData: ApplicationData;
  updateLicenseType: (type: string) => void;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateDocuments: (docs: Partial<DocumentInfo>) => void;
  updatePhoto: (photo: Partial<PhotoInfo>) => void;
  setCurrentStep: (step: number) => void;
  submitApplication: () => void;
  resetApplication: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | null>(null);

const initialApplicationData: ApplicationData = {
  licenseType: '',
  personalInfo: {},
  documents: {},
  photo: {},
  currentStep: 1,
  isSubmitted: false,
};

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const [applicationData, setApplicationData] = useState<ApplicationData>(initialApplicationData);

  // Load application data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('driverLicenseApplication');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setApplicationData(parsedData);
      }
    } catch (error) {
      console.warn('Failed to load saved application data:', error);
    }
  }, []);

  // Save application data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('driverLicenseApplication', JSON.stringify(applicationData));
    } catch (error) {
      console.warn('Failed to save application data:', error);
    }
  }, [applicationData]);
  const updateLicenseType = useCallback((type: string) => {
    setApplicationData(prev => ({
      ...prev,
      licenseType: type
    }));
  }, []);

  const updatePersonalInfo = useCallback((info: Partial<PersonalInfo>) => {
    setApplicationData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...info }
    }));
  }, []);

  const updateDocuments = useCallback((docs: Partial<DocumentInfo>) => {
    setApplicationData(prev => ({
      ...prev,
      documents: { ...prev.documents, ...docs }
    }));
  }, []);

  const updatePhoto = useCallback((photo: Partial<PhotoInfo>) => {
    setApplicationData(prev => ({
      ...prev,
      photo: { ...prev.photo, ...photo }
    }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setApplicationData(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  const submitApplication = useCallback(() => {
    // Generate a mock application ID
    const applicationId = `DLV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    setApplicationData(prev => ({
      ...prev,
      isSubmitted: true,
      applicationId
    }));
  }, []);

  const resetApplication = useCallback(() => {
    setApplicationData(initialApplicationData);
    try {
      localStorage.removeItem('driverLicenseApplication');
    } catch (error) {
      console.warn('Failed to clear saved application data:', error);
    }
  }, []);

  return (
    <ApplicationContext.Provider value={{
      applicationData,
      updateLicenseType,
      updatePersonalInfo,
      updateDocuments,
      updatePhoto,
      setCurrentStep,
      submitApplication,
      resetApplication
    }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
}
