"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faArrowRight,  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useApplication, type PersonalInfo } from '@/contexts/ApplicationContext';
import { ApplicationSteps, LoadingSpinner } from '../components/ApplicationShared';

export default function PersonalInfoPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applicationData, updatePersonalInfo, updateLicenseType, setCurrentStep } = useApplication();

  const [formData, setFormData] = useState<Partial<PersonalInfo>>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    gender: '',
    nationality: 'Burundian',
    nationalId: '',
    phoneNumber: '',
    email: user?.email || '',
    address: {
      province: '',
      commune: '',
      zone: '',
      street: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: ''
    }
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});  // Initialize data from context and URL params
  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Handle license type from URL params
  useEffect(() => {
    const licenseType = searchParams?.get('type');
    if (licenseType && licenseType !== applicationData.licenseType) {
      updateLicenseType(licenseType);
    }
  }, [searchParams, applicationData.licenseType, updateLicenseType]);

  // Load saved personal info data
  useEffect(() => {
    if (applicationData.personalInfo) {
      setFormData(prev => ({ ...prev, ...applicationData.personalInfo }));
    }
  }, [applicationData.personalInfo]);

  // Show loading while checking authentication or redirecting
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }
  
  // If user is not authenticated, let ConditionalLayout handle the redirect
  if (!user) {
    return null;
  }

  const provinces = [
    'Bubanza', 'Bujumbura Mairie', 'Bujumbura Rural', 'Bururi', 'Cankuzo',
    'Cibitoke', 'Gitega', 'Karuzi', 'Kayanza', 'Kirundo', 'Makamba',
    'Muramvya', 'Muyinga', 'Mwaro', 'Ngozi', 'Rumonge', 'Rutana', 'Ruyigi'
  ];

  const relationships = [
    'Parent', 'Spouse', 'Sibling', 'Child', 'Relative', 'Friend', 'Colleague'
  ];
  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PersonalInfo] as object || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Required fields validation
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'placeOfBirth', 'gender',
      'nationality', 'nationalId', 'phoneNumber', 'email'
    ];

    requiredFields.forEach(field => {
      if (!formData[field as keyof PersonalInfo]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Address validation
    if (!formData.address?.province) newErrors['address.province'] = 'Province is required';
    if (!formData.address?.commune) newErrors['address.commune'] = 'Commune is required';
    if (!formData.address?.zone) newErrors['address.zone'] = 'Zone is required';

    // Emergency contact validation
    if (!formData.emergencyContact?.name) newErrors['emergencyContact.name'] = 'Emergency contact name is required';
    if (!formData.emergencyContact?.relationship) newErrors['emergencyContact.relationship'] = 'Relationship is required';
    if (!formData.emergencyContact?.phoneNumber) newErrors['emergencyContact.phoneNumber'] = 'Emergency contact phone is required';

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation (basic)
    if (formData.phoneNumber && !/^\+?[0-9\s-()]{8,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // National ID validation (basic - 16 digits for Burundi)
    if (formData.nationalId && !/^\d{16}$/.test(formData.nationalId.replace(/\s/g, ''))) {
      newErrors.nationalId = 'National ID must be 16 digits';
    }

    // Age validation
    if (formData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const minAge = applicationData.licenseType === 'motorcycle' ? 16 : 
                    applicationData.licenseType === 'commercial' ? 21 : 18;

      if (age < minAge) {
        newErrors.dateOfBirth = `You must be at least ${minAge} years old for this license type`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      updatePersonalInfo(formData);
      router.push('/apply/documents');
    }
  };

  const handleBack = () => {
    updatePersonalInfo(formData);
    router.push('/apply');
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationSteps currentStep={2} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-inter font-bold text-gray-900 mb-2">
              Personal Information
            </h2>
            <p className="text-gray-600 font-inter">
              Please provide your personal details as they appear on your official documents.
            </p>
          </div>

          <form className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName || ''}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D]"
                    placeholder="Enter your middle name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                    }`}
                    title="Select your date of birth"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Place of Birth *
                  </label>
                  <input
                    type="text"
                    value={formData.placeOfBirth || ''}
                    onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.placeOfBirth ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your place of birth"
                  />
                  {errors.placeOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.placeOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.gender ? 'border-red-300' : 'border-gray-300'
                    }`}
                    title="Select your gender"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Identity & Contact */}
            <div>
              <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">
                Identity & Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality *
                  </label>
                  <input
                    type="text"
                    value={formData.nationality || ''}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.nationality ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your nationality"
                  />
                  {errors.nationality && (
                    <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    National ID Number *
                  </label>
                  <input
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.nationalId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="1234 5678 9012 3456"
                  />
                  {errors.nationalId && (
                    <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+257 XX XX XX XX"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">
                Current Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province *
                  </label>                  <select
                    value={formData.address?.province || ''}
                    onChange={(e) => handleInputChange('address.province', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors['address.province'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    title="Select your province"
                  >
                    <option value="">Select province</option>
                    {provinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                  {errors['address.province'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.province']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commune *
                  </label>
                  <input
                    type="text"
                    value={formData.address?.commune || ''}
                    onChange={(e) => handleInputChange('address.commune', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors['address.commune'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter commune"
                  />
                  {errors['address.commune'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.commune']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zone *
                  </label>
                  <input
                    type="text"
                    value={formData.address?.zone || ''}
                    onChange={(e) => handleInputChange('address.zone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors['address.zone'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter zone"
                  />
                  {errors['address.zone'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.zone']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street/Address
                  </label>
                  <input
                    type="text"
                    value={formData.address?.street || ''}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D]"
                    placeholder="Enter street address"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact?.name || ''}
                    onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors['emergencyContact.name'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter contact name"
                  />
                  {errors['emergencyContact.name'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['emergencyContact.name']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>                  <select
                    value={formData.emergencyContact?.relationship || ''}
                    onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors['emergencyContact.relationship'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    title="Select relationship to emergency contact"
                  >
                    <option value="">Select relationship</option>
                    {relationships.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                  {errors['emergencyContact.relationship'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['emergencyContact.relationship']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact?.phoneNumber || ''}
                    onChange={(e) => handleInputChange('emergencyContact.phoneNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C8E5D] focus:border-[#2C8E5D] ${
                      errors['emergencyContact.phoneNumber'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+257 XX XX XX XX"
                  />
                  {errors['emergencyContact.phoneNumber'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['emergencyContact.phoneNumber']}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-inter font-medium text-yellow-800 mb-1">
                    Important Notice
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Please ensure all information matches your official documents exactly. Any discrepancies may delay your application processing.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
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
                <span>Continue to Documents</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
