import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Instructor, Student } from '../types';
import { Card } from './Card';
import { control } from './ui';
import ThemedSelect from './ThemedSelect';
import { AddressInput } from './AddressInput';
import { GuardianManagement } from './GuardianInput';
import { formatPhilippinePhone, validatePhilippinePhone, calculateAge } from '../services/philippineAddressService';
import { INSTRUMENT_OPTIONS } from '../constants';

interface EnrollmentPageProps {
  instructors: Instructor[];
  students: Student[];
  onRequestEnrollment: (studentData: {
    name: string;
    nickname?: string;
    birthdate?: string;
    instrument: string;
    instructorId: string;
    age: number;
    email?: string;
    contactNumber?: string;
    gender: 'Male' | 'Female';
    facebook?: string;
    address?: {
      country?: string;
      province?: string;
      city?: string;
      barangay?: string;
      addressLine1?: string;
      addressLine2?: string;
    };
    guardianFullName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianFacebook?: string;
    secondaryGuardian?: {
      fullName?: string;
      relationship?: string;
      phone?: string;
      email?: string;
      facebook?: string;
    };
    parentStudentId?: string; // Links to original student for multi-instrument tracking
  }) => void;
  successMessage: string | null;
}

// helpers for uniform phone handling
const normalizePhone = (v: string) => v.replace(/[^\d]/g, '');

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      default:
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white dark:bg-slate-800 shadow-xl transition-all">
          <div className="px-6 py-4">
            {/* Icon and Title */}
            <div className="flex items-center">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}>
                <span className={`text-2xl ${styles.iconColor}`}>{styles.icon}</span>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {message}
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3 flex flex-col-reverse gap-2 sm:flex-row sm:gap-3 rounded-b-lg">
            <button
              type="button"
              className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmBtn}`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Validation wrapper component
interface FieldValidationProps {
  error?: string;
  children: React.ReactNode;
}

const FieldValidation: React.FC<FieldValidationProps> = ({ error, children }) => {
  const hasError = error && error.length > 0;
  
  return (
    <div className="relative">
      {children}
      {hasError && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-1 animate-fadeIn">
          {error}
        </div>
      )}
    </div>
  );
};
const formatPhone = (v: string) => formatPhilippinePhone(v);
const isValidPhone = (v: string) => validatePhilippinePhone(v);

export const EnrollmentPage: React.FC<EnrollmentPageProps> = ({ instructors, students, onRequestEnrollment, successMessage }) => {
  const [isExistingStudent, setIsExistingStudent] = useState(false);
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(0);
  const [instrument, setInstrument] = useState('');
  const [instructorId, setInstructorId] = useState(instructors.length > 0 ? instructors[0].id : '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  // Student Facebook (optional)
  const [facebook, setFacebook] = useState('');
  
  // Address state with proper type handling
  const [address, setAddress] = useState({
    country: 'Philippines',
    province: '',
    city: '',
    barangay: '',
    addressLine1: '',
    addressLine2: '',
  });
  
  // Guardian Details state - enhanced with primary and secondary guardians
  const [primaryGuardian, setPrimaryGuardian] = useState({
    fullName: '',
    relationship: '',
    phone: '',
    email: '',
    facebook: '',
  });
  
  const [secondaryGuardian, setSecondaryGuardian] = useState<{
    fullName?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    facebook?: string;
  } | undefined>(undefined);

  // Address change handler
  const handleAddressChange = (newAddress: {
    country?: string;
    province?: string;
    city?: string;
    barangay?: string;
    addressLine1?: string;
    addressLine2?: string;
  }) => {
    setAddress({
      country: newAddress.country || 'Philippines',
      province: newAddress.province || '',
      city: newAddress.city || '',
      barangay: newAddress.barangay || '',
      addressLine1: newAddress.addressLine1 || '',
      addressLine2: newAddress.addressLine2 || '',
    });
  };

  // Guardian change handlers
  const handlePrimaryGuardianChange = (guardian: {
    fullName?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    facebook?: string;
  }) => {
    setPrimaryGuardian({
      fullName: guardian.fullName || '',
      relationship: guardian.relationship || '',
      phone: guardian.phone || '',
      email: guardian.email || '',
      facebook: guardian.facebook || '',
    });
  };

  const handleSecondaryGuardianChange = (guardian: {
    fullName?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    facebook?: string;
  } | undefined) => {
    setSecondaryGuardian(guardian);
  };
  
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [contactPhoneError, setContactPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Field-level validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [showValidation, setShowValidation] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingModeChange, setPendingModeChange] = useState<boolean | null>(null);

  // Calculate age from birthdate
  useEffect(() => {
    if (birthdate) {
      const calculatedAgeValue = calculateAge(new Date(birthdate));
      setCalculatedAge(calculatedAgeValue);
      setAge(calculatedAgeValue.toString());
    }
  }, [birthdate]);

  const isMinor = calculatedAge > 0 && calculatedAge < 18;

  const enrolledInstruments = useMemo(() => {
    if (!isExistingStudent || !selectedExistingStudentId) {
      return [];
    }
    const selectedStudentRecord = students.find(s => s.id === selectedExistingStudentId);
    if (!selectedStudentRecord) return [];

    const rootStudentId = selectedStudentRecord.parentStudentId || selectedStudentRecord.id;
    const rootStudent = students.find(s => s.id === rootStudentId);
    const instruments = rootStudent ? [rootStudent.instrument] : [];

    students.forEach(student => {
      if (student.parentStudentId === rootStudentId) {
        instruments.push(student.instrument);
      }
    });
    return instruments;
  }, [selectedExistingStudentId, students, isExistingStudent]);

  const availableInstrumentsForEnrollment = useMemo(() => {
    if (!isExistingStudent) {
      return INSTRUMENT_OPTIONS;
    }
    return INSTRUMENT_OPTIONS.filter(opt => !enrolledInstruments.includes(opt));
  }, [enrolledInstruments, isExistingStudent]);

  const availableInstructors = useMemo(() => {
    if (!instrument) {
      return instructors;
    }
    return instructors.filter(i => Array.isArray(i.specialty) && i.specialty.includes(instrument));
  }, [instrument, instructors]);

  // Enhanced field dependencies with proper validation flow
  const canSelectInstrument = useMemo(() => {
    if (isExistingStudent) {
      return !!selectedExistingStudentId;
    }
    // For new students, require basic info first
    return !!(name.trim() && gender && (birthdate || age));
  }, [isExistingStudent, selectedExistingStudentId, name, gender, birthdate, age]);

  const canSelectInstructor = useMemo(() => {
    return canSelectInstrument && !!instrument;
  }, [canSelectInstrument, instrument]);

  // Enhanced validation functions
  const validateField = useCallback((fieldName: string, value: unknown): string => {
    switch (fieldName) {
      case 'selectedExistingStudentId':
        if (isExistingStudent && !value) return 'Please select an existing student';
        return '';
        
      case 'name':
        if (!isExistingStudent) {
          const nameValue = String(value || '');
          if (!nameValue || !nameValue.trim()) return 'Student name is required';
          if (nameValue.trim().length < 2) return 'Name must be at least 2 characters';
          if (!/^[a-zA-Z\s\-.]+$/.test(nameValue.trim())) return 'Name can only contain letters, spaces, hyphens, and periods';
        }
        return '';
        
      case 'gender':
        if (!isExistingStudent && !value) return 'Gender selection is required';
        return '';
        
      case 'birthdate':
        if (!isExistingStudent) {
          if (!value && !age) return 'Either birthdate or age is required';
          if (value) {
            const dateValue = String(value);
            const date = new Date(dateValue);
            const today = new Date();
            if (date > today) return 'Birthdate cannot be in the future';
            const calculatedAge = today.getFullYear() - date.getFullYear();
            if (calculatedAge > 100) return 'Please verify the birthdate (age seems too high)';
            if (calculatedAge < 3) return 'Student must be at least 3 years old';
          }
        }
        return '';
        
      case 'age':
        if (!isExistingStudent && !birthdate && value) {
          const ageValue = String(value);
          const ageNum = parseInt(ageValue, 10);
          if (isNaN(ageNum)) return 'Age must be a valid number';
          if (ageNum < 3) return 'Student must be at least 3 years old';
          if (ageNum > 100) return 'Please verify the age';
        }
        return '';
        
      case 'email':
        if (value) {
          const emailValue = String(value);
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            return 'Please enter a valid email address';
          }
        }
        return '';
        
      case 'contactNumber':
        if (value) {
          const phoneValue = String(value);
          if (!isValidPhone(phoneValue)) {
            return 'Please enter a valid Philippine phone number (e.g., 09123456789)';
          }
        }
        return '';
        
      case 'instrument':
        if (!value) return 'Instrument selection is required';
        return '';
        
      case 'instructorId':
        if (!value) return 'Instructor selection is required';
        if (instrument && availableInstructors.length === 0) {
          return 'No instructors available for selected instrument';
        }
        return '';
        
      case 'addressLine1': {
        const addressValue = String(value || '');
        if (!addressValue || !addressValue.trim()) return 'Street address is required';
        if (addressValue.trim().length < 5) return 'Please provide a complete street address';
        return '';
      }
        
      case 'province':
        if (!value) return 'Province selection is required';
        return '';
        
      case 'city':
        if (!value) return 'City/Municipality selection is required';
        return '';
        
      case 'barangay':
        if (!value) return 'Barangay selection is required';
        return '';
        
      case 'primaryGuardianName':
        if (isMinor) {
          if (!primaryGuardian.fullName || !primaryGuardian.fullName.trim()) {
            return 'Guardian name is required for students under 18';
          }
          if (primaryGuardian.fullName.trim().length < 2) {
            return 'Guardian name must be at least 2 characters';
          }
        } else {
          // For adults, validate only if provided
          if (primaryGuardian.fullName && !primaryGuardian.fullName.trim()) {
            return 'Guardian name cannot be empty if provided';
          }
          if (primaryGuardian.fullName && primaryGuardian.fullName.trim().length < 2) {
            return 'Guardian name must be at least 2 characters';
          }
        }
        return '';
        
      case 'primaryGuardianRelationship':
        if (isMinor) {
          if (!primaryGuardian.relationship) {
            return 'Guardian relationship is required for students under 18';
          }
        } else {
          // For adults, require only if guardian name is provided
          if (primaryGuardian.fullName && !primaryGuardian.relationship) {
            return 'Guardian relationship is required when guardian name is provided';
          }
        }
        return '';
        
      case 'primaryGuardianPhone':
        if (primaryGuardian.fullName && !primaryGuardian.phone) {
          return 'Guardian phone is required when guardian name is provided';
        }
        if (primaryGuardian.phone && !isValidPhone(primaryGuardian.phone)) {
          return 'Please enter a valid Philippine phone number';
        }
        return '';
        
      case 'primaryGuardianEmail':
        if (primaryGuardian.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryGuardian.email)) {
          return 'Please enter a valid email address';
        }
        return '';
        
      case 'secondaryGuardianPhone':
        if (secondaryGuardian?.phone && !isValidPhone(secondaryGuardian.phone)) {
          return 'Please enter a valid Philippine phone number';
        }
        return '';
        
      case 'secondaryGuardianEmail':
        if (secondaryGuardian?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondaryGuardian.email)) {
          return 'Please enter a valid email address';
        }
        return '';
        
      default:
        return '';
    }
  }, [isMinor, primaryGuardian, secondaryGuardian, isExistingStudent, availableInstructors, instrument, age, birthdate]);

  // Validate all fields and return errors object
  const validateAllFields = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    // Student selection/info validation
    if (isExistingStudent) {
      const studentError = validateField('selectedExistingStudentId', selectedExistingStudentId);
      if (studentError) errors.selectedExistingStudentId = studentError;
    } else {
      const nameError = validateField('name', name);
      if (nameError) errors.name = nameError;
      
      const genderError = validateField('gender', gender);
      if (genderError) errors.gender = genderError;
      
      const birthdateError = validateField('birthdate', birthdate);
      if (birthdateError) errors.birthdate = birthdateError;
      
      const ageError = validateField('age', age);
      if (ageError) errors.age = ageError;
      
      const emailError = validateField('email', email);
      if (emailError) errors.email = emailError;
      
      const phoneError = validateField('contactNumber', contactNumber);
      if (phoneError) errors.contactNumber = phoneError;
    }
    
    // Lesson assignment validation
    const instrumentError = validateField('instrument', instrument);
    if (instrumentError) errors.instrument = instrumentError;
    
    const instructorError = validateField('instructorId', instructorId);
    if (instructorError) errors.instructorId = instructorError;
    
    // Address validation
    const provinceError = validateField('province', address.province);
    if (provinceError) errors.province = provinceError;
    
    const cityError = validateField('city', address.city);
    if (cityError) errors.city = cityError;
    
    const barangayError = validateField('barangay', address.barangay);
    if (barangayError) errors.barangay = barangayError;
    
    const addressError = validateField('addressLine1', address.addressLine1);
    if (addressError) errors.addressLine1 = addressError;
    
    // Guardian validation
    const guardianNameError = validateField('primaryGuardianName', primaryGuardian.fullName);
    if (guardianNameError) errors.primaryGuardianName = guardianNameError;
    
    const guardianRelationshipError = validateField('primaryGuardianRelationship', primaryGuardian.relationship);
    if (guardianRelationshipError) errors.primaryGuardianRelationship = guardianRelationshipError;
    
    const guardianPhoneError = validateField('primaryGuardianPhone', primaryGuardian.phone);
    if (guardianPhoneError) errors.primaryGuardianPhone = guardianPhoneError;
    
    const guardianEmailError = validateField('primaryGuardianEmail', primaryGuardian.email);
    if (guardianEmailError) errors.primaryGuardianEmail = guardianEmailError;
    
    // Secondary guardian validation
    const secondaryPhoneError = validateField('secondaryGuardianPhone', secondaryGuardian?.phone);
    if (secondaryPhoneError) errors.secondaryGuardianPhone = secondaryPhoneError;
    
    const secondaryEmailError = validateField('secondaryGuardianEmail', secondaryGuardian?.email);
    if (secondaryEmailError) errors.secondaryGuardianEmail = secondaryEmailError;
    
    return errors;
  };

  // Auto-validate guardian fields when age or guardian data changes
  useEffect(() => {
    setFieldErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      
      // Validate guardian name
      const guardianNameError = validateField('primaryGuardianName', primaryGuardian.fullName);
      if (guardianNameError) {
        newErrors.primaryGuardianName = guardianNameError;
      } else {
        delete newErrors.primaryGuardianName;
      }
      
      // Validate guardian relationship
      const guardianRelationshipError = validateField('primaryGuardianRelationship', primaryGuardian.relationship);
      if (guardianRelationshipError) {
        newErrors.primaryGuardianRelationship = guardianRelationshipError;
      } else {
        delete newErrors.primaryGuardianRelationship;
      }
      
      return newErrors;
    });
  }, [calculatedAge, primaryGuardian.fullName, primaryGuardian.relationship, isMinor, validateField]);

  // Helper to check if field should show error
  const shouldShowFieldError = (fieldName: string): boolean => {
    // Always show validation after form submission attempt
    if (showValidation) return true;
    
    // Always show guardian errors for minors if fields are empty and required
    if (isMinor && fieldName === 'primaryGuardianName' && (!primaryGuardian.fullName || !primaryGuardian.fullName.trim())) {
      return true;
    }
    if (isMinor && fieldName === 'primaryGuardianRelationship' && !primaryGuardian.relationship) {
      return true;
    }
    
    // Show error if field has been touched
    return fieldTouched[fieldName] || false;
  };

  // Helper to get field error if it should be shown
  const getFieldError = (fieldName: string): string => {
    if (!shouldShowFieldError(fieldName)) return '';
    return fieldErrors[fieldName] || '';
  };

  // Handle field blur to mark as touched and validate
  const handleFieldBlur = (fieldName: string, value: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // Handle field change to clear error and validate
  const handleFieldChange = (fieldName: string, value: string) => {
    // Clear error immediately when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
    
    // Validate if field was touched
    if (fieldTouched[fieldName]) {
      const error = validateField(fieldName, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  useEffect(() => {
    if (instrument && availableInstructors.length > 0) {
      if (!availableInstructors.find(i => i.id === instructorId)) {
        setInstructorId(availableInstructors[0].id);
      }
    } else if (availableInstructors.length === 0) {
      setInstructorId('');
    }
  }, [instrument, availableInstructors, instructorId]);

  // Handle existing student selection
  const handleExistingStudentChange = (studentId: string) => {
    setSelectedExistingStudentId(studentId);
    const selectedStudent = students.find(s => s.id === studentId);
    if (selectedStudent) {
      setName(selectedStudent.name);
      setNickname(selectedStudent.nickname || '');
      setBirthdate(selectedStudent.birthdate || '');
      setAge(selectedStudent.age?.toString() || '');
      setGender(selectedStudent.gender || '');
      setEmail(selectedStudent.email || '');
      setContactNumber(selectedStudent.contactNumber || '');
      setFacebook(selectedStudent.facebook || '');
      
      // Set address
      if (selectedStudent.address) {
        handleAddressChange({
          country: selectedStudent.address.country || 'Philippines',
          province: selectedStudent.address.province || '',
          city: selectedStudent.address.city || '',
          barangay: selectedStudent.address.barangay || '',
          addressLine1: selectedStudent.address.addressLine1 || '',
          addressLine2: selectedStudent.address.addressLine2 || '',
        });
      } else {
        handleAddressChange({
          country: 'Philippines',
          province: '',
          city: '',
          barangay: '',
          addressLine1: '',
          addressLine2: '',
        });
      }
      
      // Set primary guardian
      handlePrimaryGuardianChange({
        fullName: selectedStudent.guardianFullName || '',
        relationship: 'Parent',
        phone: selectedStudent.guardianPhone || '',
        email: selectedStudent.guardianEmail || '',
        facebook: selectedStudent.guardianFacebook || '',
      });
      
      // Set secondary guardian
      if (selectedStudent.secondaryGuardian) {
        handleSecondaryGuardianChange({
          fullName: selectedStudent.secondaryGuardian.fullName || '',
          relationship: selectedStudent.secondaryGuardian.relationship || '',
          phone: selectedStudent.secondaryGuardian.phone || '',
          email: selectedStudent.secondaryGuardian.email || '',
          facebook: selectedStudent.secondaryGuardian.facebook || '',
        });
      } else {
        handleSecondaryGuardianChange(undefined);
      }
      
      // Don't auto-fill instrument or instructor - let user choose new ones
    }
    if (!studentId) {
      // If the selection was cleared, reset lesson assignment fields
      setInstrument('');
      setInstructorId('');
    }
  };

  // Helper function to check if form has any data
  const hasFormData = () => {
    return !!(
      name.trim() ||
      nickname.trim() ||
      birthdate ||
      age ||
      gender ||
      email.trim() ||
      contactNumber.trim() ||
      facebook.trim() ||
      instrument.trim() ||
      instructorId ||
      address.province ||
      address.city ||
      address.barangay ||
      primaryGuardian.fullName.trim() ||
      primaryGuardian.phone.trim() ||
      selectedExistingStudentId
    );
  };

  // Helper function to clear all form fields
  const clearAllFields = () => {
    setSelectedExistingStudentId('');
    setName('');
    setNickname('');
    setBirthdate('');
    setAge('');
    setGender('');
    setEmail('');
    setContactNumber('');
    setFacebook('');
    setInstrument('');
    setInstructorId('');
    setError(null);
    setValidationErrors([]);
    setContactPhoneError(null);
    
    handleAddressChange({
      country: 'Philippines',
      province: '',
      city: '',
      barangay: '',
      addressLine1: '',
      addressLine2: '',
    });
    
    handlePrimaryGuardianChange({
      fullName: '',
      relationship: '',
      phone: '',
      email: '',
      facebook: '',
    });
    
    handleSecondaryGuardianChange(undefined);
  };

  // Enhanced mode change handler with beautiful modal confirmation
  const handleModeChange = (isExisting: boolean) => {
    // If no data or not switching modes, proceed immediately
    if (isExistingStudent === isExisting || !hasFormData()) {
      clearAllFields();
      setIsExistingStudent(isExisting);
      
      // Set default instructor if available
      if (instructors.length > 0) {
        setInstructorId(instructors[0].id);
      }
      return;
    }
    
    // Show confirmation modal for data loss warning
    setPendingModeChange(isExisting);
    setShowConfirmModal(true);
  };

  // Handle modal confirmation
  const handleConfirmModeChange = () => {
    if (pendingModeChange !== null) {
      clearAllFields();
      setIsExistingStudent(pendingModeChange);
      
      // Set default instructor if available
      if (instructors.length > 0) {
        setInstructorId(instructors[0].id);
      }
      
      setPendingModeChange(null);
    }
  };

  // Handle modal cancellation
  const handleCancelModeChange = () => {
    setPendingModeChange(null);
    setShowConfirmModal(false);
  };
  
  useEffect(() => {
    // When a success message comes from the parent, clear the form.
    if (successMessage) {
        setIsExistingStudent(false);
        setSelectedExistingStudentId('');
        setName('');
        setNickname('');
        setBirthdate('');
        setInstrument('');
        setInstructorId(instructors.length > 0 ? instructors[0].id : '');
        setAge('');
        setGender('');
        setEmail('');
        setContactNumber('');
        setFacebook('');
        handleAddressChange({
          country: 'Philippines',
          province: '',
          city: '',
          barangay: '',
          addressLine1: '',
          addressLine2: '',
        });
        handlePrimaryGuardianChange({
          fullName: '',
          relationship: '',
          phone: '',
          email: '',
          facebook: '',
        });
        handleSecondaryGuardianChange(undefined);
        setError(null);
        setContactPhoneError(null);
    }
  }, [successMessage, instructors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    setShowValidation(true); // Show all validation errors
    
    try {
      // Comprehensive field validation
      const fieldValidationErrors = validateAllFields();
      setFieldErrors(fieldValidationErrors);
      
      // Mark all fields as touched when submitting to show all errors
      if (Object.keys(fieldValidationErrors).length > 0) {
        const allFieldsTouched: Record<string, boolean> = {};
        Object.keys(fieldValidationErrors).forEach(field => {
          allFieldsTouched[field] = true;
        });
        setFieldTouched(prev => ({ ...prev, ...allFieldsTouched }));
      }
      
      const errorMessages = Object.values(fieldValidationErrors).filter(error => error.length > 0);
      
      // Display errors if any
      if (errorMessages.length > 0) {
        setError(`Please fix the following ${errorMessages.length} issue${errorMessages.length > 1 ? 's' : ''} before submitting:`);
        setValidationErrors(errorMessages);
        return;
      }

      // Clear any previous errors
      setError(null);
      setValidationErrors([]);
      setFieldErrors({});

      // Prepare final age
      let finalAge = calculatedAge;
      if (!birthdate && age) {
        finalAge = parseInt(age, 10);
      }

      // Proceed with enrollment submission
      onRequestEnrollment({ 
          name, 
          nickname: nickname || undefined,
          birthdate: birthdate || undefined,
          instrument, 
          instructorId,
          age: finalAge,
          gender: gender as 'Male' | 'Female',
          email: email || undefined,
          contactNumber: contactNumber ? normalizePhone(contactNumber) : undefined,
          facebook: facebook || undefined,
          address: {
            country: address.country,
            province: address.province || undefined,
            city: address.city || undefined,
            barangay: address.barangay || undefined,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || undefined,
          },
          guardianFullName: primaryGuardian.fullName || undefined,
          guardianPhone: primaryGuardian.phone ? normalizePhone(primaryGuardian.phone) : undefined,
          guardianEmail: primaryGuardian.email || undefined,
          guardianFacebook: primaryGuardian.facebook || undefined,
          secondaryGuardian: secondaryGuardian && (secondaryGuardian.fullName || secondaryGuardian.phone || secondaryGuardian.email) ? {
            fullName: secondaryGuardian.fullName || undefined,
            relationship: secondaryGuardian.relationship || undefined,
            phone: secondaryGuardian.phone ? normalizePhone(secondaryGuardian.phone) : undefined,
            email: secondaryGuardian.email || undefined,
            facebook: secondaryGuardian.facebook || undefined,
          } : undefined,
          // Link to original student if this is multi-instrument enrollment
          parentStudentId: isExistingStudent ? selectedExistingStudentId : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputClasses = control;
  const labelClasses = "block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1";

  return (
    <Card className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary mb-2">New Student Enrollment</h2>
          <p className="text-text-secondary dark:text-slate-400 mb-6">Fill out the form below to register a new student in the system.</p>
          
          {error && (
            <div className="bg-status-red-light dark:bg-status-red/20 border border-status-red/20 text-status-red px-4 py-3 rounded-md mb-4 font-medium" role="alert">
              <div className="font-semibold mb-2">Please fix the following issues:</div>
              {validationErrors.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              ) : (
                <div>{error}</div>
              )}
            </div>
          )}

          <div className="space-y-8">
            {/* Enrollment Type Selection */}
            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
              <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Enrollment Type</legend>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="enrollmentType"
                      value="new"
                      checked={!isExistingStudent}
                      onChange={() => handleModeChange(false)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      !isExistingStudent
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                    }`}>
                      {!isExistingStudent && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-text-primary dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">New Student</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="enrollmentType"
                      value="existing"
                      checked={isExistingStudent}
                      onChange={() => handleModeChange(true)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isExistingStudent
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                    }`}>
                      {isExistingStudent && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-text-primary dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Existing Student (Different Instrument)</span>
                </label>
              </div>
            </fieldset>

            {/* Existing Student Selection */}
            {isExistingStudent && (
              <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
                <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Select Existing Student</legend>
                <div>
                  <label htmlFor="existingStudent" className={labelClasses}>Select Existing Student *</label>
                  <FieldValidation error={getFieldError('selectedExistingStudentId')}>
                    <ThemedSelect
                      id="existingStudent"
                      value={selectedExistingStudentId}
                      onChange={(e) => {
                        handleExistingStudentChange(e.target.value);
                        handleFieldChange('selectedExistingStudentId', e.target.value);
                      }}
                      onBlur={(e) => handleFieldBlur('selectedExistingStudentId', e.target.value)}
                      wrapperClassName={getFieldError('selectedExistingStudentId') ? 'border-red-500' : ''}
                    >
                      <option value="">Choose a student...</option>
                      {students
                        .filter(s => s.status === 'active')
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(student => (
                          <option key={student.id} value={student.id}>
                            {student.name} - {student.instrument} (ID: {student.studentIdNumber})
                          </option>
                        ))}
                    </ThemedSelect>
                  </FieldValidation>
                  {isExistingStudent && selectedExistingStudentId && (
                    <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                      Student details have been auto-filled. You can select a new instrument and instructor below.
                    </p>
                  )}
                </div>
              </fieldset>
            )}

             <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
                <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Student Information</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="studentName" className={labelClasses}>
                      Student Full Name <span className="text-status-red">*</span>
                    </label>
                    <FieldValidation error={getFieldError('name')}>
                      <input 
                        type="text" 
                        id="studentName"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          handleFieldChange('name', e.target.value);
                        }}
                        onBlur={(e) => handleFieldBlur('name', e.target.value)}
                        className={`${inputClasses} ${
                          isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''
                        } ${getFieldError('name') ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="e.g., Jane Doe"
                        readOnly={isExistingStudent}
                      />
                    </FieldValidation>
                  </div>
                  <div>
                    <label htmlFor="nickname" className={labelClasses}>Nickname (Optional)</label>
                    <input 
                      type="text" 
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                      placeholder="e.g., Janie"
                      readOnly={isExistingStudent}
                    />
                  </div>
                  <div>
                    <label htmlFor="birthdate" className={labelClasses}>
                      Birthdate {calculatedAge === 0 ? <span className="text-status-red">*</span> : '(Optional)'}
                    </label>
                    <FieldValidation error={getFieldError('birthdate')}>
                      <input 
                        type="date" 
                        id="birthdate"
                        value={birthdate}
                        onChange={(e) => {
                          setBirthdate(e.target.value);
                          handleFieldChange('birthdate', e.target.value);
                        }}
                        onBlur={(e) => handleFieldBlur('birthdate', e.target.value)}
                        className={`${inputClasses} ${
                          isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''
                        } ${getFieldError('birthdate') ? 'border-red-500 focus:border-red-500' : ''}`}
                        readOnly={isExistingStudent}
                      />
                    </FieldValidation>
                    {birthdate && calculatedAge > 0 && (
                      <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                        Calculated age: {calculatedAge} years old
                      </p>
                    )}
                  </div>
                   <div>
                    <label htmlFor="age" className={labelClasses}>
                      Age {!birthdate ? <span className="text-status-red">*</span> : '(Auto-calculated)'}
                    </label>
                    <FieldValidation error={getFieldError('age')}>
                      <input 
                        type="number" 
                        id="age"
                        value={age}
                        onChange={(e) => {
                          setAge(e.target.value);
                          handleFieldChange('age', e.target.value);
                        }}
                        onBlur={(e) => handleFieldBlur('age', e.target.value)}
                        className={`${inputClasses} ${
                          isExistingStudent || birthdate ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''
                        } ${getFieldError('age') ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="e.g., 14"
                        min="1"
                        readOnly={isExistingStudent || !!birthdate}
                      />
                    </FieldValidation>
                    {!birthdate && (
                      <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                        Enter age manually or provide birthdate above for auto-calculation
                      </p>
                    )}
                  </div>
                </div>
                 <div>
                    <label htmlFor="gender" className={labelClasses}>
                      Gender <span className="text-status-red">*</span>
                    </label>
                    <FieldValidation error={getFieldError('gender')}>
                      <ThemedSelect 
                        id="gender"
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value as 'Male' | 'Female' | '');
                          handleFieldChange('gender', e.target.value);
                        }}
                        onBlur={(e) => handleFieldBlur('gender', e.target.value)}
                        disabled={isExistingStudent}
                        wrapperClassName={`${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800' : ''} ${
                          getFieldError('gender') ? 'border-red-500' : ''
                        }`}
                      >
                        <option value="" disabled>Select gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </ThemedSelect>
                    </FieldValidation>
                 </div>
                {isMinor && (
                  <div className="text-sm text-status-yellow bg-status-yellow-light dark:bg-status-yellow/20 px-3 py-2 rounded-md">
                    <p className="font-medium">Minor Student Detected</p>
                    <p>This student is under 18 years old. Guardian information is recommended for emergency contact.</p>
                  </div>
                )}
            </fieldset>

            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
                <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Contact Details</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                       <label htmlFor="email" className={labelClasses}>Email Address (Optional)</label>
                       <input 
                         type="email" 
                         id="email" 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                         placeholder="e.g., jane.doe@example.com" 
                         readOnly={isExistingStudent}
                       />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="contactNumber" className={labelClasses}>Student's Contact Number (Optional)</label>
                        <input 
                            type="tel" 
                            id="contactNumber" 
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            onBlur={() => !isExistingStudent && setContactNumber(prev => formatPhone(prev))}
                            className={`${inputClasses} ${contactPhoneError ? 'border-status-red' : ''} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                            placeholder="e.g., 0917 123 4567" 
                            readOnly={isExistingStudent}
                        />
                        {contactPhoneError && <div className="text-xs text-status-red mt-1">{contactPhoneError}</div>}
                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                          Philippine format: 09XX XXX XXXX or +63 9XX XXX XXXX (Optional)
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="facebook" className={labelClasses}>Facebook Profile (Optional)</label>
                        <input 
                            type="text" 
                            id="facebook" 
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                            placeholder="Facebook name or https://facebook.com/..." 
                            readOnly={isExistingStudent}
                        />
                    </div>
                 </div>
            </fieldset>

            {/* Address Information */}
            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
              <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">
                Address Information
              </legend>
              <p className="text-sm text-text-secondary dark:text-slate-400 -mt-2">
                Complete address information for records and emergency contact.
              </p>
              <AddressInput
                address={address}
                onChange={handleAddressChange}
                disabled={isExistingStudent}
                errors={{
                  province: getFieldError('province'),
                  city: getFieldError('city'),
                  barangay: getFieldError('barangay'),
                  addressLine1: getFieldError('addressLine1')
                }}
              />
            </fieldset>

            {/* Guardian Details - Enhanced */}
            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
              <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">
                Guardian/Parent Information
              </legend>
              <p className="text-sm text-text-secondary dark:text-slate-400 -mt-2">
                Emergency contact information. Phone numbers are optional but recommended.
              </p>
              <GuardianManagement
                primaryGuardian={primaryGuardian}
                secondaryGuardian={secondaryGuardian}
                onPrimaryGuardianChange={handlePrimaryGuardianChange}
                onSecondaryGuardianChange={handleSecondaryGuardianChange}
                disabled={isExistingStudent}
                isMinor={isMinor}
                onBlur={handleFieldBlur}
                errors={{
                  primaryGuardianName: getFieldError('primaryGuardianName'),
                  primaryGuardianRelationship: getFieldError('primaryGuardianRelationship'),
                  primaryGuardianPhone: getFieldError('primaryGuardianPhone'),
                  primaryGuardianEmail: getFieldError('primaryGuardianEmail')
                }}
              />
            </fieldset>

            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
                 <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Lesson Assignment</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="instrument" className={labelClasses}>Instrument <span className="text-status-red">*</span></label>
                    <FieldValidation error={getFieldError('instrument')}>
                      <ThemedSelect
                        id="instrument"
                        value={instrument}
                        onChange={(e) => {
                          setInstrument(e.target.value);
                          handleFieldChange('instrument', e.target.value);
                        }}
                        onBlur={(e) => handleFieldBlur('instrument', e.target.value)}
                        disabled={!canSelectInstrument || (isExistingStudent && availableInstrumentsForEnrollment.length === 0)}
                        wrapperClassName={getFieldError('instrument') ? 'border-red-500' : ''}
                      >
                        <option value="" disabled>
                          {!canSelectInstrument 
                            ? (isExistingStudent 
                                ? "Select an existing student first"
                                : "Complete student basic info first")
                            : "Select an instrument..."
                          }
                        </option>
                        {canSelectInstrument && availableInstrumentsForEnrollment.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        {isExistingStudent && selectedExistingStudentId && availableInstrumentsForEnrollment.length === 0 && (
                          <option disabled>No new instruments available</option>
                        )}
                      </ThemedSelect>
                    </FieldValidation>
                    {isExistingStudent && selectedExistingStudentId && (
                      <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                        Instruments the student is already enrolled in are not shown.
                      </p>
                    )}
                    {!canSelectInstrument && !isExistingStudent && shouldShowFieldError('instrument') && (
                      <p className="text-xs text-status-red dark:text-red-400 mt-1">
                        Please complete student name, gender, and age/birthdate first.
                      </p>
                    )}
                    {isExistingStudent && !selectedExistingStudentId && (
                      <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                        Select an existing student to choose an instrument.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="instructorId" className={labelClasses}>Assign Instructor <span className="text-status-red">*</span></label>
                    <FieldValidation error={getFieldError('instructorId')}>
                      <ThemedSelect
                        id="instructorId"
                        value={instructorId}
                        onChange={(e) => {
                          setInstructorId(e.target.value);
                          handleFieldChange('instructorId', e.target.value);
                        }}
                        onBlur={(e) => handleFieldBlur('instructorId', e.target.value)}
                        disabled={!canSelectInstructor || availableInstructors.length === 0}
                        wrapperClassName={getFieldError('instructorId') ? 'border-red-500' : ''}
                      >
                        {canSelectInstructor && instrument && availableInstructors.length > 0 ? (
                          availableInstructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.specialty.join(', ')})</option>)
                        ) : (
                          <option disabled>
                            {!canSelectInstructor 
                              ? "Select an instrument first"
                              : instrument 
                                ? 'No instructors for this instrument'
                                : 'Select an instrument first'
                            }
                          </option>
                        )}
                      </ThemedSelect>
                    </FieldValidation>
                    {!canSelectInstructor && !instrument && shouldShowFieldError('instructorId') && (
                      <p className="text-xs text-status-red dark:text-red-400 mt-1">
                        Complete previous fields to enable instructor selection.
                      </p>
                    )}
                  </div>
                 </div>
            </fieldset>
          </div>
        </div>
        <div className="bg-surface-header dark:bg-slate-700/50 p-4 flex justify-end rounded-b-lg border-t border-surface-border dark:border-slate-700">
          <button 
            type="submit" 
            className="px-6 py-2 rounded-md font-semibold text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={instructors.length === 0 || isSubmitting}
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting 
              ? 'Processing...' 
              : (isExistingStudent ? 'Enroll in New Instrument' : 'Enroll Student')
            }
          </button>
        </div>
      </form>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelModeChange}
        onConfirm={handleConfirmModeChange}
        title="Confirm Enrollment Type Change"
        message={
          pendingModeChange 
            ? "Switching to 'Existing Student' will clear all the information you've entered. Are you sure you want to continue?"
            : "Switching to 'New Student' will clear all the information you've entered. Are you sure you want to continue?"
        }
        confirmText="Yes, Clear Data"
        cancelText="Keep Current Data"
        type="warning"
      />
    </Card>
  );
};