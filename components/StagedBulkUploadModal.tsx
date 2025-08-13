import React, { useState, useRef, useEffect, useMemo } from 'react';
import { INSTRUMENT_OPTIONS } from '../constants';
import type { Student, Instructor } from '../types';
import { AddressInput } from './AddressInput';
import { GuardianManagement } from './GuardianInput';
import ThemedSelect from './ThemedSelect';

// Staging data structures
interface CSVStudentData {
  fullName: string;
  nickname?: string;
  birthdate?: string;
  gender?: 'Male' | 'Female';
  instrument: string;
}

interface StagedStudent {
  tempId: string;
  csvData: CSVStudentData;
  enrollmentData?: Partial<Student>;
  status: 'pending' | 'completed' | 'skipped';
  validationErrors?: string[];
}

interface StagedBulkUpload {
  id: string;
  uploadedAt: Date;
  students: StagedStudent[];
  completedCount: number;
  totalCount: number;
  status: 'staging' | 'completing' | 'cancelled';
}

interface StagedBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchEnrollment: (students: Partial<Student>[]) => Promise<void>;
  instructors: Instructor[];
  maxBatchSize?: number;
}

// Helper function for age calculation
const calculateAge = (birthdate: string | Date): number => {
  const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const StagedBulkUploadModal: React.FC<StagedBulkUploadModalProps> = ({
  isOpen,
  onClose,
  onBatchEnrollment,
  instructors,
  maxBatchSize = 50
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [stagedUpload, setStagedUpload] = useState<StagedBulkUpload | null>(null);
  const [step, setStep] = useState<'upload' | 'staging' | 'completion' | 'review' | 'success'>('upload');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [showBatchProgress, setShowBatchProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  
  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [_dragCounter, setDragCounter] = useState(0);
  
  // Enrollment form state for current student
  const [enrollmentForm, setEnrollmentForm] = useState({
    // Personal info (pre-filled from CSV)
    name: '',
    nickname: '',
    birthdate: '',
    age: '',
    gender: '' as 'Male' | 'Female' | '',
    
    // Contact info
    email: '',
    contactNumber: '',
    facebook: '',
    
    // Lesson assignment
    instrument: '',
    instructorId: '',
    
    // Address
    address: {
      country: 'Philippines',
      province: '',
      city: '',
      barangay: '',
      addressLine1: '',
      addressLine2: '',
    },
    
    // Guardian info
    primaryGuardian: {
      fullName: '',
      relationship: '',
      occupation: '',
      phone: '',
      email: '',
      facebook: '',
    },
    
    secondaryGuardian: undefined as {
      fullName?: string;
      relationship?: string;
      occupation?: string;
      phone?: string;
      email?: string;
      facebook?: string;
    } | undefined,
  });
  
  const [calculatedAge, setCalculatedAge] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate age from birthdate
  useEffect(() => {
    if (enrollmentForm.birthdate) {
      const calculatedAgeValue = calculateAge(enrollmentForm.birthdate);
      setCalculatedAge(calculatedAgeValue);
      setEnrollmentForm(prev => ({ ...prev, age: calculatedAgeValue.toString() }));
    }
  }, [enrollmentForm.birthdate]);

  const isStudentMinor = calculatedAge > 0 && calculatedAge < 18;

  // Pre-fill form when current student changes
  useEffect(() => {
    if (stagedUpload && step === 'completion') {
      const currentStudent = stagedUpload.students[currentStudentIndex];
      if (currentStudent) {
        // Reset all form state first
        setFieldErrors({});
        setValidationErrors([]);
        setCalculatedAge(0);
        setIsSubmitting(false);
        
        // Pre-fill form with CSV data
        const resetForm = {
          name: currentStudent.csvData.fullName,
          nickname: currentStudent.csvData.nickname || '',
          birthdate: currentStudent.csvData.birthdate || '',
          age: '',
          gender: (currentStudent.csvData.gender || '') as 'Male' | 'Female' | '',
          email: '',
          contactNumber: '',
          facebook: '',
          instrument: currentStudent.csvData.instrument,
          instructorId: '',
          address: {
            country: 'Philippines',
            province: '',
            city: '',
            barangay: '',
            addressLine1: '',
            addressLine2: '',
          },
          primaryGuardian: {
            fullName: '',
            relationship: '',
            occupation: '',
            phone: '',
            email: '',
            facebook: '',
          },
          secondaryGuardian: undefined,
        };
        
        setEnrollmentForm(resetForm);
      }
    }
  }, [currentStudentIndex, stagedUpload, step]);

  // Complete form reset helper for better address clearing
  const _resetFormCompletely = () => {
    setEnrollmentForm({
      name: '',
      nickname: '',
      birthdate: '',
      age: '',
      gender: '',
      email: '',
      contactNumber: '',
      facebook: '',
      instrument: '',
      instructorId: '',
      address: {
        country: 'Philippines',
        province: '',
        city: '',
        barangay: '',
        addressLine1: '',
        addressLine2: '',
      },
      primaryGuardian: {
        fullName: '',
        relationship: '',
        occupation: '',
        phone: '',
        email: '',
        facebook: '',
      },
      secondaryGuardian: undefined,
    });
    setCalculatedAge(0);
  };

  // Form validation helpers
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const errorMessages: string[] = [];
    
    // Required field validation
    if (!enrollmentForm.name?.trim()) {
      errors.name = 'Student name is required';
      errorMessages.push('Student name is required');
    }
    
    if (!enrollmentForm.gender) {
      errors.gender = 'Gender is required';
      errorMessages.push('Gender is required');
    }
    
    if (!enrollmentForm.birthdate && !enrollmentForm.age) {
      errors.age = 'Either birthdate or age is required';
      errorMessages.push('Either birthdate or age is required');
    }
    
    if (!enrollmentForm.instrument) {
      errors.instrument = 'Instrument is required';
      errorMessages.push('Instrument is required');
    }
    
    if (!enrollmentForm.instructorId) {
      errors.instructorId = 'Instructor is required';
      errorMessages.push('Instructor assignment is required');
    }
    
    // Guardian validation for minors
    if (isStudentMinor && !enrollmentForm.primaryGuardian.fullName?.trim()) {
      errors.guardianName = 'Guardian name is required for minors';
      errorMessages.push('Guardian information is required for students under 18');
    }
    
    // Address validation removed - now optional for all students
    
    setFieldErrors(errors);
    
    if (errorMessages.length > 0) {
      setValidationErrors(errorMessages);
    } else {
      setValidationErrors([]);
    }
    
    return Object.keys(errors).length === 0;
  };

  // Form handlers
  const handleFormChange = (field: string, value: string | number | boolean | Date | null) => {
    setEnrollmentForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (newAddress: {
    country?: string;
    province?: string;
    city?: string;
    barangay?: string;
    addressLine1?: string;
    addressLine2?: string;
  }) => {
    setEnrollmentForm(prev => ({
      ...prev,
      address: {
        country: newAddress.country || 'Philippines',
        province: newAddress.province || '',
        city: newAddress.city || '',
        barangay: newAddress.barangay || '',
        addressLine1: newAddress.addressLine1 || '',
        addressLine2: newAddress.addressLine2 || '',
      }
    }));
  };

  const handlePrimaryGuardianChange = (guardian: {
    fullName?: string;
    relationship?: string;
    occupation?: string;
    phone?: string;
    email?: string;
    facebook?: string;
  }) => {
    setEnrollmentForm(prev => ({
      ...prev,
      primaryGuardian: {
        fullName: guardian.fullName || '',
        relationship: guardian.relationship || '',
        occupation: guardian.occupation || '',
        phone: guardian.phone || '',
        email: guardian.email || '',
        facebook: guardian.facebook || '',
      }
    }));
  };

  const handleSecondaryGuardianChange = (guardian: {
    fullName?: string;
    relationship?: string;
    occupation?: string;
    phone?: string;
    email?: string;
    facebook?: string;
  } | undefined) => {
    setEnrollmentForm(prev => ({
      ...prev,
      secondaryGuardian: guardian
    }));
  };

  // Available instructors for selected instrument
  const availableInstructors = useMemo(() => {
    if (!enrollmentForm.instrument) return [];
    return instructors.filter(i => 
      i.specialty.includes(enrollmentForm.instrument) && i.status === 'active'
    );
  }, [enrollmentForm.instrument, instructors]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragOver(false);
      }
      return newCount;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const csvFile = files.find(file => 
        file.type === 'text/csv' || 
        file.name.toLowerCase().endsWith('.csv')
      );
      
      if (csvFile) {
        processSelectedFile(csvFile);
      } else {
        setErrors(['Please drop a CSV file. Only .csv files are supported.']);
      }
    }
  };

  const generateCSVTemplate = () => {
    // CSV Headers - exactly what the user specified
    const headers = ['FullName', 'Nickname', 'Birthdate', 'Gender', 'Instrument'];
    
    // Sample data rows
    const sampleData = [
      ['John Smith', 'Johnny', '2010-05-15', 'Male', 'Piano'],
      ['Emily Johnson', 'Em', '2012-08-22', 'Female', 'Guitar'],
      ['Michael Brown', '', '2015-03-10', 'Male', 'Violin']
    ];

    // Create CSV with headers first, then data rows
    const allRows = [headers, ...sampleData];
    const csvContent = allRows.map(row => 
      row.map(cell => cell ? `"${cell}"` : '""').join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_student_upload_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): CSVStudentData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return []; // Need at least headers + 1 data row

    // First row contains headers
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data: CSVStudentData[] = [];

    // Process data rows (skip header row)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length < headers.length) continue;

      // Map headers to data values
      const student: Partial<CSVStudentData> = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header.toLowerCase()) {
          case 'fullname':
            student.fullName = value;
            break;
          case 'nickname':
            student.nickname = value || undefined;
            break;
          case 'birthdate':
            student.birthdate = value || undefined;
            break;
          case 'gender':
            student.gender = (value === 'Male' || value === 'Female') ? value : undefined;
            break;
          case 'instrument':
            student.instrument = value;
            break;
        }
      });

      // Only add student if required fields are present
      if (student.fullName && student.instrument) {
        data.push(student as CSVStudentData);
      }
    }

    return data;
  };

  const validateCSVData = (students: CSVStudentData[]): { valid: StagedStudent[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: StagedStudent[] = [];
    const seenNames = new Set<string>();

    // Check batch size limits
    if (students.length > maxBatchSize) {
      errors.push(`Batch size exceeds limit. Maximum ${maxBatchSize} students allowed, found ${students.length}.`);
      return { valid: [], errors };
    }

    if (students.length === 0) {
      errors.push('No student data found in CSV file. Ensure you have the 5 required fields: Full Name, Nickname, Birthdate, Gender, Instrument.');
      return { valid: [], errors };
    }

    students.forEach((student, index) => {
      const row = index + 2;
      const studentErrors: string[] = [];

      // Required field validation
      if (!student.fullName?.trim()) {
        studentErrors.push('Full name is required');
      }

      if (!student.instrument?.trim()) {
        studentErrors.push('Instrument is required');
      }

      if (!student.gender) {
        studentErrors.push('Gender is required');
      }

      // Duplicate name check
      const nameLower = student.fullName?.toLowerCase() || '';
      if (seenNames.has(nameLower)) {
        studentErrors.push(`Duplicate name "${student.fullName}"`);
      }
      seenNames.add(nameLower);

      // Instrument validation
      if (student.instrument && !INSTRUMENT_OPTIONS.includes(student.instrument)) {
        const suggestion = INSTRUMENT_OPTIONS.find(valid => 
          valid.toLowerCase().includes(student.instrument.toLowerCase()) ||
          student.instrument.toLowerCase().includes(valid.toLowerCase())
        );
        const suggestionText = suggestion ? ` (Did you mean "${suggestion}"?)` : '';
        studentErrors.push(`Invalid instrument "${student.instrument}"${suggestionText}`);
      }

      // Birthdate validation
      if (student.birthdate && isNaN(Date.parse(student.birthdate))) {
        studentErrors.push('Invalid birthdate format. Use YYYY-MM-DD');
      }

      // Gender validation
      if (student.gender && !['Male', 'Female'].includes(student.gender)) {
        studentErrors.push('Gender must be "Male" or "Female"');
      }

      if (studentErrors.length > 0) {
        errors.push(`Row ${row} (${student.fullName || 'Unknown'}): ${studentErrors.join(', ')}`);
      } else {
        valid.push({
          tempId: `temp_${Date.now()}_${index}`,
          csvData: student,
          status: 'pending',
          validationErrors: studentErrors.length > 0 ? studentErrors : undefined
        });
      }
    });

    return { valid, errors };
  };

  // Using the global calculateAge function

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    processSelectedFile(selectedFile);
  };

  const processSelectedFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);

    try {
      const text = await selectedFile.text();
      const csvData = parseCSV(text);
      const { valid, errors: validationErrors } = validateCSVData(csvData);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsProcessing(false);
        return;
      }

      // Create staged upload
      const staged: StagedBulkUpload = {
        id: `bulk_${Date.now()}`,
        uploadedAt: new Date(),
        students: valid,
        completedCount: 0,
        totalCount: valid.length,
        status: 'staging'
      };

      setStagedUpload(staged);
      setStep('staging');
    } catch {
      setErrors(['Error reading CSV file. Please check the format.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToCompletion = () => {
    if (!stagedUpload) return;
    
    setStagedUpload({
      ...stagedUpload,
      status: 'completing'
    });
    setStep('completion');
    setCurrentStudentIndex(0);
  };

  const handleStudentCompletion = async () => {
    if (!stagedUpload) {
      setValidationErrors(['No student data available']);
      return;
    }

    if (!validateForm()) {
      // Validation errors are already set by validateForm()
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]); // Clear any previous errors
    
    try {
      const enrollmentData = {
        instructorId: enrollmentForm.instructorId,
        email: enrollmentForm.email || undefined,
        contactNumber: enrollmentForm.contactNumber || undefined,
        facebook: enrollmentForm.facebook || undefined,
        address: enrollmentForm.address,
        guardianFullName: enrollmentForm.primaryGuardian.fullName || undefined,
        guardianRelationship: enrollmentForm.primaryGuardian.relationship || undefined,
        guardianPhone: enrollmentForm.primaryGuardian.phone || undefined,
        guardianEmail: enrollmentForm.primaryGuardian.email || undefined,
        guardianFacebook: enrollmentForm.primaryGuardian.facebook || undefined,
        secondaryGuardian: enrollmentForm.secondaryGuardian,
      };

      const updatedStudents = [...stagedUpload.students];
      updatedStudents[currentStudentIndex] = {
        ...updatedStudents[currentStudentIndex],
        enrollmentData,
        status: 'completed'
      };

      const newCompletedCount = updatedStudents.filter(s => s.status === 'completed').length;
      
      setStagedUpload({
        ...stagedUpload,
        students: updatedStudents,
        completedCount: newCompletedCount
      });

      // Move to next student or finish
      const nextIndex = currentStudentIndex + 1;
      if (nextIndex < stagedUpload.totalCount) {
        setCurrentStudentIndex(nextIndex);
        
        // Scroll to top of the modal for next student
        setTimeout(() => {
          if (scrollableContentRef.current) {
            scrollableContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
        
        // Form will be automatically populated with next student's data via useEffect
      } else {
        // All students processed, proceed to batch commit
        await handleBatchCommit(updatedStudents);
      }
    } catch (error) {
      console.error('Error completing student enrollment:', error);
      setValidationErrors(['Failed to complete student enrollment. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStudent = () => {
    if (!stagedUpload) return;

    const updatedStudents = [...stagedUpload.students];
    updatedStudents[currentStudentIndex] = {
      ...updatedStudents[currentStudentIndex],
      status: 'skipped'
    };

    setStagedUpload({
      ...stagedUpload,
      students: updatedStudents
    });

    // Move to next student or finish
    const nextIndex = currentStudentIndex + 1;
    if (nextIndex < stagedUpload.totalCount) {
      setCurrentStudentIndex(nextIndex);
      
      // Scroll to top of the modal for next student
      setTimeout(() => {
        if (scrollableContentRef.current) {
          scrollableContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      
      // Force address clearing by setting a timeout to ensure state has updated
      setTimeout(() => {
        setEnrollmentForm(prev => ({
          ...prev,
          address: {
            country: 'Philippines',
            province: '',
            city: '',
            barangay: '',
            addressLine1: '',
            addressLine2: '',
          }
        }));
      }, 150);
    } else {
      // All students processed, check if any were completed
      const completedStudents = updatedStudents.filter(s => s.status === 'completed');
      if (completedStudents.length > 0) {
        handleBatchCommit(updatedStudents);
      } else {
        setErrors(['No students were completed for enrollment.']);
        setStep('upload'); // Go back to upload step
      }
    }
  };

  const handleBatchCommit = async (students: StagedStudent[]) => {
    const completedStudents = students.filter(s => s.status === 'completed' && s.enrollmentData);
    
    // Batch commit - Total students: ${students.length}
    // Batch commit - Completed students: ${completedStudents.length}
    
    if (completedStudents.length === 0) {
      setErrors(['No students were completed for enrollment.']);
      return;
    }

    setShowBatchProgress(true);
    
    try {
      const studentsToEnroll = completedStudents.map(s => ({
        ...s.enrollmentData,
        name: s.csvData.fullName,
        nickname: s.csvData.nickname,
        birthdate: s.csvData.birthdate,
        gender: s.csvData.gender,
        instrument: s.csvData.instrument,
        age: s.csvData.birthdate ? new Date().getFullYear() - new Date(s.csvData.birthdate).getFullYear() : undefined,
        status: 'active' as const,
        sessionsAttended: 0,
        sessionsBilled: 0,
        creditBalance: 0
      }));

      // Students to enroll: ${studentsToEnroll.length} students
      await onBatchEnrollment(studentsToEnroll);
      setStep('review');
    } catch (error) {
      console.error('Batch enrollment error:', error);
      setErrors(['Failed to enroll students. Please try again.']);
      setShowBatchProgress(false);
    }
  };

  const handleCancel = () => {
    // Clear all staging data
    setStagedUpload(null);
    setFile(null);
    setErrors([]);
    setStep('upload');
    setCurrentStudentIndex(0);
    setShowBatchProgress(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  if (!isOpen) return null;

  const currentStudent = stagedUpload?.students[currentStudentIndex];
  const isMinor = currentStudent?.csvData.birthdate ? calculateAge(currentStudent.csvData.birthdate) < 18 : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step === 'upload' ? handleClose : undefined}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-surface-card dark:bg-slate-800 rounded-lg shadow-xl border border-surface-border dark:border-slate-700 w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100">
              Bulk Student Upload
            </h2>
            {stagedUpload && (
              <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">
                {step === 'staging' && `${stagedUpload.totalCount} students ready for enrollment`}
                {step === 'completion' && `Completing student ${currentStudentIndex + 1} of ${stagedUpload.totalCount}`}
                {step === 'review' && `Review ${stagedUpload.completedCount} students before final registration`}
                {step === 'success' && `Successfully enrolled ${stagedUpload.completedCount} students`}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'completion' || showBatchProgress}
            className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div ref={scrollableContentRef} className="p-6 overflow-y-auto scrollbar-hidden max-h-[calc(90vh-140px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-4">
                <h3 className="font-medium text-text-primary dark:text-slate-100 mb-2">Bulk Student Upload Process</h3>
                <div className="text-sm text-text-secondary dark:text-slate-300 space-y-1">
                  <p><strong>Step 1:</strong> Download CSV template with proper headers</p>
                  <p><strong>Step 2:</strong> Fill CSV with student data (multiple rows)</p>
                  <p><strong>Step 3:</strong> Upload CSV - system processes multiple students</p>
                  <p><strong>Step 4:</strong> Complete enrollment details for each student</p>
                  <p><strong>Step 5:</strong> Confirm batch registration to database</p>
                  <p className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-800 dark:text-blue-200">
                    <strong>CSV Format:</strong> Headers in first row (FullName, Nickname, Birthdate, Gender, Instrument), data in subsequent rows.
                  </p>
                </div>
              </div>

              {/* Download Template */}
              <div className="flex justify-center">
                <button
                  onClick={generateCSVTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download CSV Template with Headers</span>
                </button>
              </div>

              {/* File Upload */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-brand-primary bg-brand-primary/5' 
                    : 'border-surface-border dark:border-slate-600'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <svg className="w-12 h-12 text-text-tertiary dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-text-primary dark:text-slate-100 font-medium">
                      {file ? file.name : isDragOver ? 'Drop CSV file here' : 'Click to upload or drag CSV file'}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-slate-400">
                      CSV with headers: FullName, Nickname, Birthdate, Gender, Instrument
                    </p>
                  </div>
                </label>
              </div>

              {/* Processing */}
              {isProcessing && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 text-text-secondary dark:text-slate-400">
                    <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Processing CSV file...</span>
                  </div>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-status-red/10 border border-status-red/20 rounded-lg p-4">
                  <h4 className="font-medium text-status-red mb-2">Validation Errors</h4>
                  <div className="text-sm text-status-red space-y-1 max-h-40 overflow-y-auto scrollbar-hidden">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-start space-x-1">
                        <span className="text-status-red mt-0.5">•</span>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'staging' && stagedUpload && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-text-primary dark:text-slate-100">
                  CSV Data Validated ({stagedUpload.totalCount} students)
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 text-sm border border-surface-border dark:border-slate-600 rounded-md hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToCompletion}
                    className="px-4 py-1 text-sm bg-brand-primary text-white rounded-md hover:opacity-90 transition-opacity"
                  >
                    Proceed to Complete Enrollment
                  </button>
                </div>
              </div>

              {/* Next Steps Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Before Proceeding</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You will need to complete enrollment details for each student individually. Required information includes:
                  <strong> instructor assignment, complete address, and guardian information</strong> (for students under 18).
                  This process cannot be cancelled once started.
                </p>
              </div>

              {/* Preview Table */}
              <div className="border border-surface-border dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto scrollbar-hidden max-h-96">
                  <table className="min-w-full divide-y divide-surface-border dark:divide-slate-700">
                    <thead className="bg-surface-table-header dark:bg-slate-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Nickname</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Age</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Gender</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Instrument</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Needs</th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface-card dark:bg-slate-800 divide-y divide-surface-border dark:divide-slate-700">
                      {stagedUpload.students.map((student, _index) => {
                        const age = student.csvData.birthdate ? calculateAge(student.csvData.birthdate) : null;
                        const needsGuardian = age !== null && age < 18;
                        
                        return (
                          <tr key={student.tempId}>
                            <td className="px-4 py-2 text-sm text-text-primary dark:text-slate-100">{student.csvData.fullName}</td>
                            <td className="px-4 py-2 text-sm text-text-secondary dark:text-slate-300">{student.csvData.nickname || '-'}</td>
                            <td className="px-4 py-2 text-sm text-text-secondary dark:text-slate-300">{age || 'Unknown'}</td>
                            <td className="px-4 py-2 text-sm text-text-secondary dark:text-slate-300">{student.csvData.gender || '-'}</td>
                            <td className="px-4 py-2 text-sm text-text-secondary dark:text-slate-300">{student.csvData.instrument}</td>
                            <td className="px-4 py-2 text-sm">
                              <div className="flex flex-wrap gap-1">
                                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                                  Instructor
                                </span>
                                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                                  Address
                                </span>
                                {needsGuardian && (
                                  <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded">
                                    Guardian
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'completion' && currentStudent && (
            <div className="space-y-6">
              {/* Progress Header */}
              <div className="bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-text-primary dark:text-slate-100">
                    Complete Enrollment: {currentStudent.csvData.fullName}
                  </h3>
                  <span className="text-sm text-text-secondary dark:text-slate-400">
                    {currentStudentIndex + 1} of {stagedUpload?.totalCount}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-surface-border dark:bg-slate-600 rounded-full h-2">
                  <div 
                    className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStudentIndex) / (stagedUpload?.totalCount || 1)) * 100}%` }}
                  />
                </div>
                
                <div className="mt-2 text-sm text-text-secondary dark:text-slate-400">
                  <strong>From CSV:</strong> {currentStudent.csvData.fullName} 
                  {currentStudent.csvData.nickname && ` (${currentStudent.csvData.nickname})`}
                  {currentStudent.csvData.birthdate && `, Age ${calculateAge(currentStudent.csvData.birthdate)}`}
                  , {currentStudent.csvData.gender}, {currentStudent.csvData.instrument}
                </div>
                
                {isMinor && (
                  <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-orange-800 dark:text-orange-200 text-sm">
                    ⚠️ <strong>Minor (under 18):</strong> Guardian information required
                  </div>
                )}
              </div>

              {/* Enrollment Form Integration Point */}
              <div className="bg-surface-card dark:bg-slate-800 rounded-lg border border-surface-border dark:border-slate-700 p-6">
                <h4 className="font-medium text-text-primary dark:text-slate-100 mb-4">
                  Complete Required Information
                </h4>
                
                {/* This is where we'll integrate the enrollment form components */}
                <div className="space-y-4">
                  <div className="p-4 border border-surface-border dark:border-slate-600 rounded-lg">
                    <p className="text-sm text-text-secondary dark:text-slate-400 mb-2">
                      Required fields to complete:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
                        <span>Instructor Assignment</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-status-green rounded-full"></span>
                        <span>Complete Address (Street, Province, City, Barangay)</span>
                      </li>
                      {isMinor && (
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          <span>Guardian Information (Name, Relationship, Phone)</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Enrollment Form Integration */}
                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            Please fix the following errors:
                          </h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <ul className="list-disc pl-5 space-y-1">
                              {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student Information Section */}
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <h5 className="font-medium text-text-primary dark:text-slate-100 mb-3">Student Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-slate-200 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={enrollmentForm.name}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-slate-200 mb-1">
                          Nickname
                        </label>
                        <input
                          type="text"
                          value={enrollmentForm.nickname}
                          onChange={(e) => handleFormChange('nickname', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-slate-200 mb-1">
                          Birthdate
                        </label>
                        <input
                          type="date"
                          value={enrollmentForm.birthdate}
                          onChange={(e) => handleFormChange('birthdate', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-slate-200 mb-1">
                          Gender
                        </label>
                        <ThemedSelect
                          value={enrollmentForm.gender}
                          onChange={(e) => handleFormChange('gender', e.target.value)}
                          disabled
                        >
                          <option value="">Select gender...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </ThemedSelect>
                      </div>
                    </div>
                    
                    {calculatedAge > 0 && (
                      <p className="text-sm text-text-secondary dark:text-slate-400 mt-2">
                        Age: {calculatedAge} years old {isStudentMinor ? '(Minor - Guardian required)' : ''}
                      </p>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-text-primary dark:text-slate-100">Contact Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-slate-200 mb-1">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={enrollmentForm.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100"
                          placeholder="student@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-slate-200 mb-1">
                          Contact Number (Optional)
                        </label>
                        <input
                          type="tel"
                          value={enrollmentForm.contactNumber}
                          onChange={(e) => handleFormChange('contactNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100"
                          placeholder="+63 9XX XXX XXXX"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lesson Assignment */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-text-primary dark:text-slate-100">Lesson Assignment</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-slate-200 mb-1">
                          Instrument <span className="text-red-500">*</span>
                        </label>
                        <ThemedSelect
                          value={enrollmentForm.instrument}
                          onChange={(e) => handleFormChange('instrument', e.target.value)}
                          disabled
                          wrapperClassName={fieldErrors.instrument ? 'border-red-500' : ''}
                        >
                          <option value="">Select instrument...</option>
                          {INSTRUMENT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </ThemedSelect>
                        {fieldErrors.instrument && (
                          <p className="text-sm text-red-500 mt-1">{fieldErrors.instrument}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-slate-200 mb-1">
                          Instructor <span className="text-red-500">*</span>
                        </label>
                        <ThemedSelect
                          value={enrollmentForm.instructorId}
                          onChange={(e) => handleFormChange('instructorId', e.target.value)}
                          wrapperClassName={fieldErrors.instructorId ? 'border-red-500' : ''}
                        >
                          <option value="">Select instructor...</option>
                          {availableInstructors.map(instructor => (
                            <option key={instructor.id} value={instructor.id}>
                              {instructor.name} ({instructor.specialty.join(', ')})
                            </option>
                          ))}
                        </ThemedSelect>
                        {fieldErrors.instructorId && (
                          <p className="text-sm text-red-500 mt-1">{fieldErrors.instructorId}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-text-primary dark:text-slate-100">Address Information</h5>
                    <AddressInput
                      key={`address-${currentStudentIndex}`}
                      address={enrollmentForm.address}
                      onChange={handleAddressChange}
                      disabled={false}
                      errors={{
                        province: fieldErrors.province,
                        city: fieldErrors.city,
                        barangay: fieldErrors.barangay,
                        addressLine1: fieldErrors.addressLine1
                      }}
                    />
                  </div>

                  {/* Guardian Information - Only for minors */}
                  {isStudentMinor && (
                    <div className="space-y-4">
                      <h5 className="font-medium text-text-primary dark:text-slate-100">Guardian Information</h5>
                      <GuardianManagement
                        primaryGuardian={enrollmentForm.primaryGuardian}
                        secondaryGuardian={enrollmentForm.secondaryGuardian}
                        onPrimaryGuardianChange={handlePrimaryGuardianChange}
                        onSecondaryGuardianChange={handleSecondaryGuardianChange}
                        disabled={false}
                        isMinor={isStudentMinor}
                        onBlur={() => {}}
                        errors={{
                          primaryGuardianName: fieldErrors.guardianName
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t border-surface-border dark:border-slate-700">
                  <button
                    onClick={handleSkipStudent}
                    className="px-4 py-2 text-sm border border-surface-border dark:border-slate-600 rounded-md hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
                  >
                    Skip This Student
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Cancel All
                    </button>
                    <button
                      onClick={handleStudentCompletion}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm bg-brand-primary text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isSubmitting ? 'Processing...' : 'Complete & Continue'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'review' && stagedUpload && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-text-primary dark:text-slate-100">
                  Review & Confirm Enrollment
                </h3>
                <p className="text-text-secondary dark:text-slate-300">
                  Please review the students below before final registration to the system.
                </p>
              </div>

              {/* Student Summary */}
              <div className="bg-surface-subtle dark:bg-slate-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-status-green">{stagedUpload.completedCount}</div>
                    <div className="text-text-secondary dark:text-slate-400">Students Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-secondary dark:text-slate-400">
                      {stagedUpload.totalCount - stagedUpload.completedCount}
                    </div>
                    <div className="text-text-secondary dark:text-slate-400">Students Skipped</div>
                  </div>
                </div>
              </div>

              {/* Students List Preview */}
              <div className="space-y-3">
                <h4 className="font-medium text-text-primary dark:text-slate-100">Students to be Registered:</h4>
                <div className="max-h-60 overflow-y-auto scrollbar-hidden space-y-2 border border-surface-border dark:border-slate-700 rounded-lg p-3">
                  {stagedUpload.students
                    .filter(s => s.status === 'completed')
                    .map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface-card dark:bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-text-primary dark:text-slate-100">
                          {student.csvData.fullName}
                        </div>
                        <div className="text-sm text-text-secondary dark:text-slate-400">
                          {student.csvData.instrument} • {student.enrollmentData?.guardianFullName || 'No guardian info'}
                        </div>
                      </div>
                      <div className="text-sm text-status-green bg-status-green/10 px-2 py-1 rounded">
                        Ready
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setStep('completion')}
                  className="flex-1 px-4 py-2 border border-surface-border dark:border-slate-600 text-text-primary dark:text-slate-200 rounded-md hover:bg-surface-subtle dark:hover:bg-slate-800 transition-colors"
                >
                  ← Back to Edit Students
                </button>
                <button
                  onClick={() => setStep('success')}
                  className="flex-1 px-4 py-2 bg-status-green text-white rounded-md hover:opacity-90 transition-opacity font-medium"
                >
                  ✓ Confirm & Register All Students
                </button>
              </div>
            </div>
          )}

          {step === 'success' && stagedUpload && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-status-green/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-status-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary dark:text-slate-100">
                Batch Upload Successful!
              </h3>
              <div className="space-y-2">
                <p className="text-text-secondary dark:text-slate-300">
                  Successfully enrolled {stagedUpload.completedCount} out of {stagedUpload.totalCount} students.
                </p>
                {stagedUpload.totalCount - stagedUpload.completedCount > 0 && (
                  <p className="text-sm text-text-secondary dark:text-slate-400">
                    {stagedUpload.totalCount - stagedUpload.completedCount} students were skipped and not enrolled.
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-brand-primary text-white rounded-md hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          )}

          {/* Batch Progress Overlay */}
          {showBatchProgress && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="bg-surface-card dark:bg-slate-800 rounded-lg p-6 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-text-primary dark:text-slate-100 font-medium">
                  Enrolling students to database...
                </p>
                <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">
                  Please wait while we process the batch enrollment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StagedBulkUploadModal;
