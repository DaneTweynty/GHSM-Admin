import React, { useState, useRef } from 'react';
import { Card } from './Card';
import { ICONS } from '../constants';
import type { Student, Instructor } from '../types';

interface BulkStudentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (students: Partial<Student>[]) => void;
  instructors: Instructor[];
}

interface CSVStudent {
  name: string;
  email?: string;
  contactNumber?: string;
  instrument: string;
  guardianName?: string;
  guardianPhone?: string;
  birthdate?: string;
  gender?: 'Male' | 'Female';
}

export const BulkStudentUploadModal: React.FC<BulkStudentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  instructors
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<CSVStudent[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateCSVTemplate = () => {
    // Core fields for initial import (required + basic optional)
    const headers = [
      'name',
      'instrument', 
      'email',
      'contactNumber',
      'guardianName',
      'guardianPhone',
      'birthdate',
      'gender'
    ];

    // Create reference data for valid options
    const instrumentOptions = ['Piano', 'Guitar', 'Violin', 'Drums', 'Voice', 'Ukulele', 'Bass Guitar'];
    const genderOptions = ['Male', 'Female'];

    const sampleData = [
      [
        'John Smith',
        'Piano',
        'john.smith@email.com',
        '+63-912-345-6789',
        'Mary Smith',
        '+63-912-345-6788',
        '2010-05-15',
        'Male'
      ],
      [
        'Emily Johnson',
        'Guitar',
        'emily.johnson@email.com',
        '+63-912-345-6790',
        'David Johnson',
        '+63-912-345-6791',
        '2012-08-22',
        'Female'
      ]
    ];

    // Create comprehensive CSV with reference sheets
    const csvSections = [
      '=== STUDENT DATA ===',
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== REFERENCE: VALID INSTRUMENTS ===',
      'Available Instruments',
      ...instrumentOptions.map(instrument => `"${instrument}"`),
      '',
      '=== REFERENCE: VALID GENDERS ===',
      'Valid Options',
      ...genderOptions.map(gender => `"${gender}"`),
      '',
      '=== REFERENCE: AVAILABLE INSTRUCTORS ===',
      'Instructor Name,Specializes In',
      ...instructors.map(instructor => `"${instructor.name}","${instructor.specialty.join(', ')}"`),
      '',
      '=== INSTRUCTIONS ===',
      'Field,Required,Description,Example',
      '"name","YES","Student full name","John Smith"',
      '"instrument","YES","Must match exactly from instruments list above","Piano"',
      '"email","NO","Student email address","student@email.com"',
      '"contactNumber","NO","Student phone number","+63-912-345-6789"',
      '"guardianName","NO","Parent/Guardian full name","Mary Smith"',
      '"guardianPhone","NO","Guardian phone number","+63-912-345-6788"',
      '"birthdate","NO","Format: YYYY-MM-DD","2010-05-15"',
      '"gender","NO","Must be Male or Female","Male"',
      '',
      '=== MIGRATION WORKFLOW ===',
      'Step,Action',
      '"1","Fill student data in STUDENT DATA section only"',
      '"2","Use reference sections to ensure valid values"',
      '"3","Upload CSV - system will validate and show preview"',
      '"4","After import, edit individual students for detailed info"',
      '"5","Assign instructors, add addresses, and update other details"'
    ];

    const csvContent = csvSections.join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_bulk_upload_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): CSVStudent[] => {
    const lines = csvText.split('\\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Find the student data section
    let dataStartIndex = -1;
    let dataEndIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('=== STUDENT DATA ===')) {
        dataStartIndex = i + 1; // Header line is next
        break;
      }
    }

    if (dataStartIndex === -1) {
      // Fallback: assume traditional CSV format
      dataStartIndex = 0;
    }

    // Find end of data section (empty line or next section)
    for (let i = dataStartIndex + 1; i < lines.length; i++) {
      if (lines[i].trim() === '' || lines[i].includes('===')) {
        dataEndIndex = i;
        break;
      }
    }

    if (dataEndIndex === -1) {
      dataEndIndex = lines.length;
    }

    const headers = lines[dataStartIndex].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const data: CSVStudent[] = [];

    for (let i = dataStartIndex + 1; i < dataEndIndex; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length < headers.length) continue;

      const student: CSVStudent = {
        name: '',
        instrument: ''
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'name':
            student.name = value;
            break;
          case 'email':
            student.email = value || undefined;
            break;
          case 'contactnumber':
            student.contactNumber = value || undefined;
            break;
          case 'instrument':
            student.instrument = value;
            break;
          case 'guardianname':
            student.guardianName = value || undefined;
            break;
          case 'guardianphone':
            student.guardianPhone = value || undefined;
            break;
          case 'birthdate':
            student.birthdate = value || undefined;
            break;
          case 'gender':
            student.gender = (value === 'Male' || value === 'Female') ? value : undefined;
            break;
        }
      });

      if (student.name && student.instrument) {
        data.push(student);
      }
    }

    return data;
  };

  const validateStudents = (students: CSVStudent[]): string[] => {
    const errors: string[] = [];
    const seenNames = new Set<string>();
    const validInstruments = ['Piano', 'Guitar', 'Violin', 'Drums', 'Voice', 'Ukulele', 'Bass Guitar'];
    const validGenders = ['Male', 'Female'];

    students.forEach((student, index) => {
      const row = index + 2; // +2 because CSV has header and is 1-indexed

      // Required fields
      if (!student.name.trim()) {
        errors.push(`Row ${row}: Name is required`);
      }
      if (!student.instrument.trim()) {
        errors.push(`Row ${row}: Instrument is required`);
      }

      // Duplicate names
      const nameLower = student.name.toLowerCase();
      if (seenNames.has(nameLower)) {
        errors.push(`Row ${row}: Duplicate name "${student.name}"`);
      }
      seenNames.add(nameLower);

      // Instrument validation with suggestions
      if (student.instrument && !validInstruments.includes(student.instrument)) {
        const suggestion = validInstruments.find(valid => 
          valid.toLowerCase().includes(student.instrument.toLowerCase()) ||
          student.instrument.toLowerCase().includes(valid.toLowerCase())
        );
        const suggestionText = suggestion ? ` (Did you mean "${suggestion}"?)` : '';
        errors.push(`Row ${row}: Invalid instrument "${student.instrument}"${suggestionText}. Valid options: ${validInstruments.join(', ')}`);
      }

      // Email validation
      if (student.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(student.email)) {
        errors.push(`Row ${row}: Invalid email format for "${student.email}"`);
      }

      // Phone validation (basic)
      if (student.contactNumber && !/^[+]?[0-9\s\-()]+$/.test(student.contactNumber)) {
        errors.push(`Row ${row}: Invalid phone format for "${student.contactNumber}"`);
      }
      if (student.guardianPhone && !/^[+]?[0-9\s\-()]+$/.test(student.guardianPhone)) {
        errors.push(`Row ${row}: Invalid guardian phone format for "${student.guardianPhone}"`);
      }

      // Birthdate validation
      if (student.birthdate && isNaN(Date.parse(student.birthdate))) {
        errors.push(`Row ${row}: Invalid birthdate format. Use YYYY-MM-DD (e.g., 2010-05-15)`);
      }

      // Gender validation with suggestions
      if (student.gender && !validGenders.includes(student.gender)) {
        errors.push(`Row ${row}: Gender must be "Male" or "Female", got "${student.gender}"`);
      }
    });

    return errors;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);

    try {
      const text = await selectedFile.text();
      const students = parseCSV(text);
      
      if (students.length === 0) {
        setErrors(['No valid student data found in CSV file. Make sure you filled the STUDENT DATA section.']);
        setIsProcessing(false);
        return;
      }

      const validationErrors = validateStudents(students);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsProcessing(false);
        return;
      }

      setPreviewData(students);
      setStep('preview');
    } catch (error) {
      setErrors(['Error reading CSV file. Please check the format.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = () => {
    setIsProcessing(true);
    
    // Convert CSV data to Student format
    const studentsToAdd: Partial<Student>[] = previewData.map(student => ({
      name: student.name,
      email: student.email,
      contactNumber: student.contactNumber,
      instrument: student.instrument,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      birthdate: student.birthdate,
      gender: student.gender,
      status: 'active' as const,
      sessionsAttended: 0,
      sessionsBilled: 0,
      creditBalance: 0
    }));

    onUpload(studentsToAdd);
    setStep('success');
    setIsProcessing(false);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-surface-card dark:bg-slate-800 rounded-lg shadow-xl border border-surface-border dark:border-slate-700 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border dark:border-slate-700">
          <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100">
            Bulk Student Upload
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-4">
                <h3 className="font-medium text-text-primary dark:text-slate-100 mb-2">Migration Workflow</h3>
                <ul className="text-sm text-text-secondary dark:text-slate-300 space-y-1">
                  <li>• <strong>Step 1:</strong> Download the CSV template with reference data</li>
                  <li>• <strong>Step 2:</strong> Fill only the "STUDENT DATA" section with basic info</li>
                  <li>• <strong>Step 3:</strong> Upload CSV for validation and preview</li>
                  <li>• <strong>Step 4:</strong> After import, edit students individually for details</li>
                  <li>• <strong>Purpose:</strong> Bulk migration of basic data, then manual refinement</li>
                </ul>
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
                  <span>Download CSV Template & Reference</span>
                </button>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-status-green/5 dark:bg-status-green/10 border border-status-green/20 rounded-lg p-3">
                  <h4 className="font-medium text-status-green mb-1">✓ Smart Validation</h4>
                  <p className="text-xs text-text-secondary dark:text-slate-300">Instrument suggestions, format checking, duplicate detection</p>
                </div>
                <div className="bg-status-blue/5 dark:bg-status-blue/10 border border-status-blue/20 rounded-lg p-3">
                  <h4 className="font-medium text-status-blue mb-1">✓ Reference Data</h4>
                  <p className="text-xs text-text-secondary dark:text-slate-300">Valid instruments, genders, and instructor info included</p>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-surface-border dark:border-slate-600 rounded-lg p-8 text-center">
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
                      {file ? file.name : 'Click to upload CSV file'}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-slate-400">
                      Fill only the STUDENT DATA section from template
                    </p>
                  </div>
                </label>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-status-red/10 border border-status-red/20 rounded-lg p-4">
                  <h4 className="font-medium text-status-red mb-2">Validation Errors</h4>
                  <div className="text-sm text-status-red space-y-1 max-h-40 overflow-y-auto">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-start space-x-1">
                        <span className="text-status-red">•</span>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-text-primary dark:text-slate-100">
                  Preview ({previewData.length} students)
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 text-sm border border-surface-border dark:border-slate-600 rounded-md hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isProcessing}
                    className="px-4 py-1 text-sm bg-brand-primary text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isProcessing ? 'Adding Students...' : `Add ${previewData.length} Students`}
                  </button>
                </div>
              </div>

              {/* Next Steps Info */}
              <div className="bg-status-blue/5 dark:bg-status-blue/10 border border-status-blue/20 rounded-lg p-3">
                <p className="text-sm text-text-secondary dark:text-slate-300">
                  <strong>After import:</strong> Students will be added with basic info. You can then edit each student individually to add instructors, detailed addresses, additional guardian info, and other specifics.
                </p>
              </div>

              {/* Preview Table */}
              <div className="border border-surface-border dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-surface-border dark:divide-slate-700">
                    <thead className="bg-surface-table-header dark:bg-slate-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Instrument</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Contact</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Guardian</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface-card dark:bg-slate-800 divide-y divide-surface-border dark:divide-slate-700">
                      {previewData.map((student, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-text-primary dark:text-slate-100">{student.name}</td>
                          <td className="px-4 py-2 text-sm text-text-secondary dark:text-slate-300">{student.instrument}</td>
                          <td className="px-4 py-2 text-sm text-text-secondary dark:text-slate-300">
                            {student.email || student.contactNumber || '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-text-secondary dark:text-slate-300">
                            {student.guardianName || '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-text-secondary dark:text-slate-300">
                            {[student.birthdate, student.gender].filter(Boolean).join(', ') || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-status-green/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-status-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary dark:text-slate-100">
                Students Added Successfully!
              </h3>
              <div className="space-y-2">
                <p className="text-text-secondary dark:text-slate-300">
                  {previewData.length} student{previewData.length !== 1 ? 's have' : ' has'} been added to the system.
                </p>
                <p className="text-sm text-text-secondary dark:text-slate-300">
                  You can now edit individual students to add instructors, detailed addresses, and other specific information.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-brand-primary text-white rounded-md hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkStudentUploadModal;
