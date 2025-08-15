// =============================================
// TEACHER APP VALIDATION UTILITIES
// Form validation helpers for teacher mobile app
// =============================================

import type { 
  SessionSummaryForm, 
  AttendanceForm, 
  ChatMessageForm,
  AttendanceStatus,
  ChatMessageType,
  PracticeAssignment 
} from '../types/database.types';

// =============================================
// VALIDATION INTERFACES
// =============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidation {
  field: string;
  value: any;
  rules: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'range' | 'custom';
  message: string;
  value?: any;
  validator?: (value: any) => boolean;
}

// =============================================
// CORE VALIDATION FUNCTIONS
// =============================================

export function validateField(field: FieldValidation): ValidationResult {
  const errors: string[] = [];

  for (const rule of field.rules) {
    switch (rule.type) {
      case 'required':
        if (!field.value || (typeof field.value === 'string' && !field.value.trim())) {
          errors.push(rule.message);
        }
        break;

      case 'minLength':
        if (typeof field.value === 'string' && field.value.length < rule.value) {
          errors.push(rule.message);
        }
        break;

      case 'maxLength':
        if (typeof field.value === 'string' && field.value.length > rule.value) {
          errors.push(rule.message);
        }
        break;

      case 'pattern':
        if (typeof field.value === 'string' && !rule.value.test(field.value)) {
          errors.push(rule.message);
        }
        break;

      case 'range':
        if (typeof field.value === 'number') {
          const [min, max] = rule.value;
          if (field.value < min || field.value > max) {
            errors.push(rule.message);
          }
        }
        break;

      case 'custom':
        if (rule.validator && !rule.validator(field.value)) {
          errors.push(rule.message);
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateMultipleFields(fields: FieldValidation[]): ValidationResult {
  const allErrors: string[] = [];

  for (const field of fields) {
    const result = validateField(field);
    allErrors.push(...result.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

// =============================================
// SESSION SUMMARY VALIDATION
// =============================================

export function validateSessionSummary(formData: SessionSummaryForm): ValidationResult {
  const fields: FieldValidation[] = [
    {
      field: 'summaryText',
      value: formData.summaryText,
      rules: [
        { type: 'required', message: 'Summary text is required' },
        { type: 'minLength', value: 10, message: 'Summary must be at least 10 characters long' },
        { type: 'maxLength', value: 2000, message: 'Summary cannot exceed 2000 characters' }
      ]
    },
    {
      field: 'topicsCovered',
      value: formData.topicsCovered,
      rules: [
        { 
          type: 'custom', 
          message: 'At least one topic covered is required',
          validator: (value: string[]) => Array.isArray(value) && value.length > 0
        }
      ]
    }
  ];

  // Validate performance rating
  if (formData.studentPerformanceRating !== undefined) {
    fields.push({
      field: 'studentPerformanceRating',
      value: formData.studentPerformanceRating,
      rules: [
        { type: 'range', value: [1, 5], message: 'Student performance rating must be between 1 and 5' }
      ]
    });
  }

  // Validate difficulty rating
  if (formData.lessonDifficultyRating !== undefined) {
    fields.push({
      field: 'lessonDifficultyRating',
      value: formData.lessonDifficultyRating,
      rules: [
        { type: 'range', value: [1, 5], message: 'Lesson difficulty rating must be between 1 and 5' }
      ]
    });
  }

  // Validate practice time
  if (formData.recommendedPracticeTime !== undefined) {
    fields.push({
      field: 'recommendedPracticeTime',
      value: formData.recommendedPracticeTime,
      rules: [
        { 
          type: 'custom', 
          message: 'Recommended practice time cannot be negative',
          validator: (value: number) => value >= 0
        }
      ]
    });
  }

  const baseValidation = validateMultipleFields(fields);

  // Validate practice assignments
  const practiceAssignmentErrors: string[] = [];
  if (formData.practiceAssignments) {
    formData.practiceAssignments.forEach((assignment, index) => {
      const assignmentValidation = validatePracticeAssignment(assignment, index + 1);
      practiceAssignmentErrors.push(...assignmentValidation.errors);
    });
  }

  return {
    isValid: baseValidation.isValid && practiceAssignmentErrors.length === 0,
    errors: [...baseValidation.errors, ...practiceAssignmentErrors]
  };
}

export function validatePracticeAssignment(
  assignment: PracticeAssignment, 
  index?: number
): ValidationResult {
  const prefix = index ? `Practice assignment ${index}` : 'Practice assignment';
  
  const fields: FieldValidation[] = [
    {
      field: 'title',
      value: assignment.title,
      rules: [
        { type: 'required', message: `${prefix} requires a title` },
        { type: 'maxLength', value: 100, message: `${prefix} title cannot exceed 100 characters` }
      ]
    },
    {
      field: 'description',
      value: assignment.description,
      rules: [
        { type: 'required', message: `${prefix} requires a description` },
        { type: 'maxLength', value: 500, message: `${prefix} description cannot exceed 500 characters` }
      ]
    }
  ];

  if (assignment.duration !== undefined) {
    fields.push({
      field: 'duration',
      value: assignment.duration,
      rules: [
        { 
          type: 'custom', 
          message: `${prefix} duration cannot be negative`,
          validator: (value: number) => value >= 0
        }
      ]
    });
  }

  return validateMultipleFields(fields);
}

// =============================================
// ATTENDANCE VALIDATION
// =============================================

export function validateAttendance(formData: AttendanceForm): ValidationResult {
  const fields: FieldValidation[] = [
    {
      field: 'status',
      value: formData.status,
      rules: [
        { type: 'required', message: 'Attendance status is required' },
        {
          type: 'custom',
          message: 'Invalid attendance status',
          validator: (value: AttendanceStatus) => 
            ['present', 'absent', 'late', 'excused'].includes(value)
        }
      ]
    }
  ];

  // Time format validation
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (formData.arrivalTime) {
    fields.push({
      field: 'arrivalTime',
      value: formData.arrivalTime,
      rules: [
        { 
          type: 'pattern', 
          value: timeRegex, 
          message: 'Invalid arrival time format (use HH:MM)' 
        }
      ]
    });
  }

  if (formData.departureTime) {
    fields.push({
      field: 'departureTime',
      value: formData.departureTime,
      rules: [
        { 
          type: 'pattern', 
          value: timeRegex, 
          message: 'Invalid departure time format (use HH:MM)' 
        }
      ]
    });
  }

  const baseValidation = validateMultipleFields(fields);
  const additionalErrors: string[] = [];

  // Business rule validations
  if (formData.status === 'present' && !formData.arrivalTime) {
    additionalErrors.push('Arrival time is required when marking as present');
  }

  if (formData.status === 'late' && !formData.arrivalTime) {
    additionalErrors.push('Arrival time is required when marking as late');
  }

  // Validate time relationship
  if (formData.arrivalTime && formData.departureTime) {
    const arrival = new Date(`1970-01-01T${formData.arrivalTime}`);
    const departure = new Date(`1970-01-01T${formData.departureTime}`);
    
    if (departure <= arrival) {
      additionalErrors.push('Departure time must be after arrival time');
    }
  }

  return {
    isValid: baseValidation.isValid && additionalErrors.length === 0,
    errors: [...baseValidation.errors, ...additionalErrors]
  };
}

// =============================================
// CHAT MESSAGE VALIDATION
// =============================================

export function validateChatMessage(formData: ChatMessageForm): ValidationResult {
  const errors: string[] = [];

  // Content validation for text messages
  if (formData.type === 'text' && !formData.content?.trim()) {
    errors.push('Message content cannot be empty');
  }

  // File validation
  if (formData.file) {
    const fileValidation = validateFile(formData.file);
    errors.push(...fileValidation.errors);
  }

  // Type validation
  const validTypes: ChatMessageType[] = ['text', 'file', 'image', 'audio'];
  if (formData.type && !validTypes.includes(formData.type)) {
    errors.push('Invalid message type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateFile(file: File): ValidationResult {
  const errors: string[] = [];

  // Size validation (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size cannot exceed 10MB');
  }

  // Type validation
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
    // Documents
    'application/pdf', 'text/plain',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not supported');
  }

  // Additional security checks
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push('Invalid file name');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// =============================================
// PROFILE VALIDATION
// =============================================

export function validateProfileUpdate(profileData: {
  full_name?: string;
  phone?: string;
  bio?: string;
}): ValidationResult {
  const fields: FieldValidation[] = [];

  if (profileData.full_name !== undefined) {
    fields.push({
      field: 'full_name',
      value: profileData.full_name,
      rules: [
        { type: 'required', message: 'Full name is required' },
        { type: 'minLength', value: 2, message: 'Full name must be at least 2 characters' },
        { type: 'maxLength', value: 100, message: 'Full name cannot exceed 100 characters' }
      ]
    });
  }

  if (profileData.phone !== undefined && profileData.phone.trim()) {
    fields.push({
      field: 'phone',
      value: profileData.phone,
      rules: [
        { 
          type: 'pattern', 
          value: /^[+]?[1-9][\d]{0,15}$/, 
          message: 'Invalid phone number format' 
        }
      ]
    });
  }

  if (profileData.bio !== undefined && profileData.bio.trim()) {
    fields.push({
      field: 'bio',
      value: profileData.bio,
      rules: [
        { type: 'maxLength', value: 1000, message: 'Bio cannot exceed 1000 characters' }
      ]
    });
  }

  return validateMultipleFields(fields);
}

// =============================================
// PASSWORD VALIDATION
// =============================================

export function validatePassword(password: string): ValidationResult {
  const fields: FieldValidation[] = [
    {
      field: 'password',
      value: password,
      rules: [
        { type: 'required', message: 'Password is required' },
        { type: 'minLength', value: 8, message: 'Password must be at least 8 characters long' },
        {
          type: 'custom',
          message: 'Password must contain at least one uppercase letter',
          validator: (value: string) => /[A-Z]/.test(value)
        },
        {
          type: 'custom',
          message: 'Password must contain at least one lowercase letter',
          validator: (value: string) => /[a-z]/.test(value)
        },
        {
          type: 'custom',
          message: 'Password must contain at least one number',
          validator: (value: string) => /\d/.test(value)
        }
      ]
    }
  ];

  return validateMultipleFields(fields);
}

// =============================================
// EMAIL VALIDATION
// =============================================

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const fields: FieldValidation[] = [
    {
      field: 'email',
      value: email,
      rules: [
        { type: 'required', message: 'Email is required' },
        { type: 'pattern', value: emailRegex, message: 'Invalid email format' }
      ]
    }
  ];

  return validateMultipleFields(fields);
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
}

export function hasValidationErrors(result: ValidationResult): boolean {
  return !result.isValid;
}

export function getFirstValidationError(result: ValidationResult): string | null {
  return result.errors.length > 0 ? result.errors[0] : null;
}
