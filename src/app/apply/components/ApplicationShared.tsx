import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { 
  faCarSide, 
  faUser, 
  faFileText, 
  faCamera, 
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

interface Step {
  step: number;
  title: string;
  description: string;
  icon: IconDefinition;
  status: 'completed' | 'current' | 'upcoming';
}

interface ApplicationStepsProps {
  currentStep: number;
}

export function ApplicationSteps({ currentStep }: ApplicationStepsProps) {
  const steps: Step[] = [
    {
      step: 1,
      title: 'Choose License Type',
      description: 'Select the type of license you want to apply for',
      icon: faCarSide,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming'
    },
    {
      step: 2,
      title: 'Personal Information',
      description: 'Provide your personal details and contact information',
      icon: faUser,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'upcoming'
    },
    {
      step: 3,
      title: 'Documents Upload',
      description: 'Upload required documents and certificates',
      icon: faFileText,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'upcoming'
    },
    {
      step: 4,
      title: 'Photo & Signature',
      description: 'Take your license photo and provide signature',
      icon: faCamera,
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'upcoming'
    },
    {
      step: 5,
      title: 'Review & Submit',
      description: 'Review your application and submit for processing',
      icon: faCheckCircle,
      status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'current' : 'upcoming'
    }
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between">
        {steps.map((stepItem, index) => (
          <div key={stepItem.step} className="flex items-center">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                stepItem.status === 'completed' 
                  ? 'bg-[#2C8E5D] text-white' 
                  : stepItem.status === 'current'
                  ? 'bg-[#2C8E5D] text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {stepItem.status === 'completed' ? (
                  <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
                ) : (
                  <FontAwesomeIcon icon={stepItem.icon} className="w-4 h-4" />
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  stepItem.status === 'current' || stepItem.status === 'completed' 
                    ? 'text-[#2C8E5D]' 
                    : 'text-gray-500'
                }`}>
                  Step {stepItem.step}
                </p>
                <p className={`text-xs ${
                  stepItem.status === 'current' || stepItem.status === 'completed'
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}>
                  {stepItem.title}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`hidden sm:block w-16 h-px mx-4 ${
                stepItem.status === 'completed' ? 'bg-[#2C8E5D]' : 'bg-gray-300'
              }`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ApplicationHeaderProps {
  userName: string;
  onDashboardClick: () => void;
}

export function ApplicationHeader({ userName, onDashboardClick }: ApplicationHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#2C8E5D] to-[#1f6a44] rounded-lg p-1.5 shadow-sm">
              <FontAwesomeIcon icon={faCarSide} className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="font-inter font-bold text-lg text-black">DLV Burundi</h1>
              <p className="font-inter text-xs text-gray-600">License Application</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-inter text-sm text-gray-700">Welcome, {userName}</span>
            <button
              onClick={onDashboardClick}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-all font-inter text-sm"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C8E5D] mx-auto"></div>
        <p className="mt-4 text-gray-600 font-inter">{message}</p>
      </div>
    </div>
  );
}
