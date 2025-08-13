import React, { useState, useEffect, useCallback } from 'react';
import type { Instructor } from '../types';
import { control } from './ui';
import { EVENT_COLORS } from '../constants';
import { INSTRUMENT_OPTIONS } from '../constants';
import toast from 'react-hot-toast';
import { generateAvatarUrl } from '../utils/avatarUtils';

interface EditInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instructor: Instructor) => void;
  instructor: Instructor | null;
  isAddMode: boolean;
}

// Validation error types
interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  specialty?: string;
}

interface FieldTouched {
  name: boolean;
  email: boolean;
  phone: boolean;
  specialty: boolean;
}

export const EditInstructorModal: React.FC<EditInstructorModalProps> = ({ isOpen, onClose, onSave, instructor, isAddMode }) => {
  const [formData, setFormData] = useState<Instructor | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [fieldTouched, setFieldTouched] = useState<FieldTouched>({
    name: false,
    email: false,
    phone: false,
    specialty: false
  });
  const [showValidation, setShowValidation] = useState(false);

  // ALL useCallback hooks must be declared BEFORE any conditional returns
  const validateEmail = useCallback((email: string): string => {
    if (!email.trim()) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  }, []);

  const validatePhone = useCallback((phone: string): string => {
    if (!phone.trim()) return '';
    
    // Basic validation - just check if it contains digits and is reasonable length
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const hasDigits = /\d/.test(cleanPhone);
    const reasonableLength = cleanPhone.length >= 7 && cleanPhone.length <= 15;
    
    if (!hasDigits || !reasonableLength) {
      return 'Please enter a valid phone number';
    }
    return '';
  }, []);

  const validateName = useCallback((name: string): string => {
    if (!name.trim()) {
      return 'Instructor name is required';
    }
    if (name.trim().length < 2) {
      return 'Instructor name must be at least 2 characters';
    }
    return '';
  }, []);

  const validateSpecialty = useCallback((specialty: string[]): string => {
    if (!Array.isArray(specialty) || specialty.length === 0) {
      return 'At least one specialty is required';
    }
    return '';
  }, []);

  const validateAllFields = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!formData) return errors;
    
    const nameError = validateName(formData.name || '');
    if (nameError) errors.name = nameError;

    const emailError = validateEmail(formData.email || '');
    if (emailError) errors.email = emailError;

    const phoneError = validatePhone(formData.phone || '');
    if (phoneError) errors.phone = phoneError;

    const specialtyError = validateSpecialty(formData.specialty || []);
    if (specialtyError) errors.specialty = specialtyError;

    return errors;
  }, [formData, validateName, validateEmail, validatePhone, validateSpecialty]);

  const getFieldError = useCallback((fieldName: keyof ValidationErrors): string => {
    if (!showValidation && !fieldTouched[fieldName]) return '';
    return validationErrors[fieldName] || '';
  }, [showValidation, fieldTouched, validationErrors]);

  const shouldShowFieldError = useCallback((fieldName: keyof ValidationErrors): boolean => {
    return (showValidation || fieldTouched[fieldName]) && !!validationErrors[fieldName];
  }, [showValidation, fieldTouched, validationErrors]);

  const handleFieldBlur = useCallback((fieldName: keyof FieldTouched, value: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const errors = { ...validationErrors };
    
    switch (fieldName) {
      case 'name':
        const nameError = validateName(value);
        if (nameError) errors.name = nameError;
        else delete errors.name;
        break;
      case 'email':
        const emailError = validateEmail(value);
        if (emailError) errors.email = emailError;
        else delete errors.email;
        break;
      case 'phone':
        const phoneError = validatePhone(value);
        if (phoneError) errors.phone = phoneError;
        else delete errors.phone;
        break;
    }
    
    setValidationErrors(errors);
  }, [validationErrors, validateName, validateEmail, validatePhone]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
    
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ValidationErrors];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleSpecialtyChange = useCallback((instrument: string, checked: boolean) => {
    setFormData(prev => {
      if (!prev) return null;
      const currentSpecialty = Array.isArray(prev.specialty) ? prev.specialty : [];
      const newSpecialty = checked 
        ? [...currentSpecialty, instrument]
        : currentSpecialty.filter(s => s !== instrument);
      
      if (checked && validationErrors.specialty) {
        setValidationErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.specialty;
          return newErrors;
        });
      }
      
      return { ...prev, specialty: newSpecialty };
    });
    
    setFieldTouched(prev => ({ ...prev, specialty: true }));
  }, [validationErrors.specialty]);

  const handleColorSelect = useCallback((color: string) => {
    setFormData(prev => prev ? { ...prev, color } : null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    const errors = validateAllFields();
    setValidationErrors(errors);
    
    setFieldTouched({
      name: true,
      email: true,
      phone: true,
      specialty: true
    });
    
    const errorMessages = Object.values(errors).filter(error => error.length > 0);
    
    if (errorMessages.length > 0) {
      // Create user-friendly error message
      const errorFields = [];
      if (errors.name) errorFields.push('Instructor Name');
      if (errors.email) errorFields.push('Email');
      if (errors.phone) errorFields.push('Phone Number');
      if (errors.specialty) errorFields.push('Specialties');
      
      let errorMessage;
      if (errorFields.length === 1) {
        errorMessage = `Please check the ${errorFields[0]} field and try again.`;
      } else if (errorFields.length === 2) {
        errorMessage = `Please check the ${errorFields[0]} and ${errorFields[1]} fields and try again.`;
      } else {
        errorMessage = `Please check the following fields: ${errorFields.slice(0, -1).join(', ')}, and ${errorFields[errorFields.length - 1]}.`;
      }
      
      toast.error(errorMessage);
      return;
    }
    
    if (formData && formData.name.trim() && Array.isArray(formData.specialty) && formData.specialty.length > 0) {
      // Generate avatar for new instructors if they don't have one
      const instructorData = {
        ...formData,
        profilePictureUrl: isAddMode && !formData.profilePictureUrl 
          ? generateAvatarUrl(formData.name)
          : formData.profilePictureUrl
      };
      
      onSave(instructorData);
      
      // Clear form state after successful submission
      setValidationErrors({});
      setFieldTouched({
        name: false,
        email: false,
        phone: false,
        specialty: false
      });
      setShowValidation(false);
    }
  }, [formData, isAddMode, onSave, validateAllFields]);

  const getInputClasses = useCallback((fieldName: keyof ValidationErrors) => {
    const baseClasses = control;
    const hasError = shouldShowFieldError(fieldName);
    return `${baseClasses} ${hasError ? 'border-status-red focus:border-status-red focus:ring-status-red' : ''}`;
  }, [shouldShowFieldError]);

  const FieldValidation = useCallback<React.FC<{ error?: string; children: React.ReactNode }>>(({ error, children }) => (
    <div>
      {children}
      {error && (
        <p className="text-xs text-status-red mt-1 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  ), []);

  // useEffect hook
  useEffect(() => {
    if (isAddMode) {
      setFormData({
        id: '',
        name: '',
        specialty: [],
        color: EVENT_COLORS[0],
        profilePictureUrl: undefined,
        status: 'active',
        email: '',
        phone: '',
        bio: '',
      });
    } else {
      setFormData(instructor);
    }
    
    setValidationErrors({});
    setFieldTouched({
      name: false,
      email: false,
      phone: false,
      specialty: false
    });
    setShowValidation(false);
  }, [instructor, isAddMode, isOpen]);

  // Early return AFTER all hooks
  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-surface-card dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200 mb-1">
                {isAddMode ? 'Add New Instructor' : 'Edit Instructor'}
              </h2>
              <p className="text-sm text-text-secondary dark:text-slate-400">
                {isAddMode ? 'Enter instructor details and preferences' : 'Update instructor information'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-slate-200 transition-colors p-1 rounded hover:bg-surface-hover dark:hover:bg-slate-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldValidation error={getFieldError('name')}>
              <label className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-1">
                Instructor Name <span className="text-status-red">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur('name', e.target.value)}
                className={getInputClasses('name')}
                placeholder="Enter instructor name"
              />
            </FieldValidation>

            <FieldValidation error={getFieldError('email')}>
              <label className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-1">
                Email <span className="text-status-red">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur('email', e.target.value)}
                className={getInputClasses('email')}
                placeholder="Enter email address"
              />
            </FieldValidation>

            <FieldValidation error={getFieldError('phone')}>
              <label className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-1">
                Phone <span className="text-status-red">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                className={getInputClasses('phone')}
                placeholder="Enter phone number"
              />
            </FieldValidation>

            <FieldValidation error={getFieldError('specialty')}>
              <label className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-3">
                Specialties <span className="text-status-red">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto scrollbar-hidden border border-surface-border dark:border-slate-600 rounded-md p-4 bg-surface-input dark:bg-slate-700">
                {INSTRUMENT_OPTIONS.map((instrument) => (
                  <label key={instrument} className="flex items-center space-x-3 text-sm text-text-primary dark:text-slate-200 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.specialty) && formData.specialty.includes(instrument)}
                        onChange={(e) => handleSpecialtyChange(instrument, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        Array.isArray(formData.specialty) && formData.specialty.includes(instrument)
                          ? 'bg-brand-primary border-brand-primary text-white'
                          : 'border-surface-border dark:border-slate-500 bg-surface-input dark:bg-slate-600 group-hover:border-brand-primary dark:group-hover:border-brand-secondary'
                      }`}>
                        {Array.isArray(formData.specialty) && formData.specialty.includes(instrument) && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="select-none group-hover:text-brand-primary dark:group-hover:text-brand-secondary transition-colors">{instrument}</span>
                  </label>
                ))}
              </div>
            </FieldValidation>

            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-3">
                Color Theme
              </label>
              <div className="flex flex-wrap gap-3 p-3 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-700">
                {EVENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary focus:ring-offset-1 relative ${
                      formData.color === color 
                        ? 'border-text-primary dark:border-slate-200 shadow-lg ring-2 ring-brand-primary dark:ring-brand-secondary ring-offset-2 ring-offset-surface-card dark:ring-offset-slate-800' 
                        : 'border-surface-border dark:border-slate-600 hover:border-text-secondary dark:hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-2">
                Bio <span className="text-text-tertiary dark:text-slate-500">(Optional)</span>
              </label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                className={`${control} resize-none`}
                rows={3}
                placeholder="Enter instructor bio (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-2">
                Status
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                      formData.status === 'active'
                        ? 'bg-brand-primary border-brand-primary text-white'
                        : 'border-surface-border dark:border-slate-500 bg-surface-input dark:bg-slate-600'
                    }`}>
                      {formData.status === 'active' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-text-primary dark:text-slate-200">Active</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                      formData.status === 'inactive'
                        ? 'bg-status-red border-status-red text-white'
                        : 'border-surface-border dark:border-slate-500 bg-surface-input dark:bg-slate-600'
                    }`}>
                      {formData.status === 'inactive' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-text-primary dark:text-slate-200">Inactive</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 pt-6 mt-2">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-text-secondary dark:text-slate-400 bg-surface-card dark:bg-slate-700 hover:bg-surface-hover dark:hover:bg-slate-600 rounded-md transition-colors border border-surface-border dark:border-slate-600 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-text-on-color rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-offset-1 font-medium shadow-sm hover:shadow"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAddMode ? "M12 6v6m0 0v6m0-6h6m-6 0H6" : "M5 13l4 4L19 7"} />
                </svg>
                <span>{isAddMode ? 'Add Instructor' : 'Save Changes'}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
