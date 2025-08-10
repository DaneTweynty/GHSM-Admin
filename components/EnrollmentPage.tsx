import React, { useState, useEffect, useMemo } from 'react';
import type { Instructor, Student } from '../types';
import { Card } from './Card';
import { control } from './ui';
import ThemedSelect from './ThemedSelect';
import { INSTRUMENT_OPTIONS } from '../constants';

interface EnrollmentPageProps {
  instructors: Instructor[];
  students: Student[];
  onRequestEnrollment: (studentData: {
    name: string;
    instrument: string;
    instructorId: string;
    age: number;
    email: string;
    contactNumber: string;
    gender: 'Male' | 'Female';
    facebook?: string;
    guardianName?: string;
    guardianFullName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianFacebook?: string;
    parentStudentId?: string; // Links to original student for multi-instrument tracking
  }) => void;
  successMessage: string | null;
}

// helpers for uniform phone handling
const normalizePhone = (v: string) => v.replace(/[^\d]/g, '');
const formatPhone = (v: string) => {
  const d = normalizePhone(v);
  if (d.length === 11 && d.startsWith('1')) {
    const core = d.slice(1);
    return `+1 (${core.slice(0,3)}) ${core.slice(3,6)}-${core.slice(6,10)}`;
  }
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
  return v;
};
const isValidPhone = (v: string) => {
  const d = normalizePhone(v);
  return d.length === 10 || (d.length === 11 && d.startsWith('1'));
};

export const EnrollmentPage: React.FC<EnrollmentPageProps> = ({ instructors, students, onRequestEnrollment, successMessage }) => {
  const [isExistingStudent, setIsExistingStudent] = useState(false);
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState('');
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('');
  const [instructorId, setInstructorId] = useState(instructors.length > 0 ? instructors[0].id : '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  // Student Facebook (optional)
  const [facebook, setFacebook] = useState('');
  // Guardian Details state
  const [guardianFullName, setGuardianFullName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianFacebook, setGuardianFacebook] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [contactPhoneError, setContactPhoneError] = useState<string | null>(null);
  const [guardianPhoneError, setGuardianPhoneError] = useState<string | null>(null);

  const isMinor = age !== '' && parseInt(age, 10) < 18;

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

  // Allow lesson assignment when creating a brand-new student,
  // or when an existing student has been selected.
  const canAssignLesson = useMemo(
    () => !isExistingStudent || !!selectedExistingStudentId,
    [isExistingStudent, selectedExistingStudentId]
  );

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
      setAge(selectedStudent.age.toString());
      setGender(selectedStudent.gender);
      setEmail(selectedStudent.email);
      setContactNumber(selectedStudent.contactNumber);
      setFacebook(selectedStudent.facebook || '');
      setGuardianFullName(selectedStudent.guardianFullName || '');
      setGuardianPhone(selectedStudent.guardianPhone || '');
      setGuardianEmail(selectedStudent.guardianEmail || '');
      setGuardianFacebook(selectedStudent.guardianFacebook || '');
      // Don't auto-fill instrument or instructor - let user choose new ones
    }
    if (!studentId) {
      // If the selection was cleared, reset lesson assignment fields
      setInstrument('');
      setInstructorId('');
    }
  };

  // Reset form when switching between new/existing student modes
  const handleModeChange = (isExisting: boolean) => {
    setIsExistingStudent(isExisting);
    if (!isExisting) {
      // Clear all fields when switching to new student
      setSelectedExistingStudentId('');
      setName('');
      setAge('');
      setGender('');
      setEmail('');
      setContactNumber('');
      setFacebook('');
      setGuardianFullName('');
      setGuardianPhone('');
      setGuardianEmail('');
      setGuardianFacebook('');
    }
    setInstrument('');
    setInstructorId(instructors.length > 0 ? instructors[0].id : '');
  };
  
  useEffect(() => {
    // When a success message comes from the parent, clear the form.
    if (successMessage) {
        setIsExistingStudent(false);
        setSelectedExistingStudentId('');
        setName('');
        setInstrument('');
        setInstructorId(instructors.length > 0 ? instructors[0].id : '');
        setAge('');
        setGender('');
        setEmail('');
        setContactNumber('');
        setFacebook('');
        // Clear guardian details
        setGuardianFullName('');
        setGuardianPhone('');
        setGuardianEmail('');
        setGuardianFacebook('');
        setError(null);
        setContactPhoneError(null);
        setGuardianPhoneError(null);
    }
  }, [successMessage, instructors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setContactPhoneError(null);
    setGuardianPhoneError(null);

    if (!name.trim() || !instrument.trim() || !instructorId || !age.trim() || !gender || !email.trim() || !contactNumber.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    if (isExistingStudent && !selectedExistingStudentId) {
      setError('Please select an existing student.');
      return;
    }

    if (!isValidPhone(contactNumber)) {
      setContactPhoneError('Enter a valid 10-digit phone (or 1+10).');
      return;
    }
    if (guardianPhone && !isValidPhone(guardianPhone)) {
      setGuardianPhoneError('Enter a valid 10-digit phone (or 1+10).');
      return;
    }

    onRequestEnrollment({ 
        name, 
        instrument, 
        instructorId,
        age: parseInt(age, 10),
        gender: gender as 'Male' | 'Female',
        email,
        contactNumber: normalizePhone(contactNumber),
        // pass student facebook (optional)
        facebook: facebook || undefined,
        // pass guardian details (optional)
        guardianFullName: guardianFullName || undefined,
        guardianPhone: guardianPhone ? normalizePhone(guardianPhone) : undefined,
        guardianEmail: guardianEmail || undefined,
        guardianFacebook: guardianFacebook || undefined,
        // Link to original student if this is multi-instrument enrollment
        parentStudentId: isExistingStudent ? selectedExistingStudentId : undefined,
    });
  };
  
  const inputClasses = control;
  const labelClasses = "block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1";

  return (
    <Card className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary mb-2">New Student Enrollment</h2>
          <p className="text-text-secondary dark:text-slate-400 mb-6">Fill out the form below to register a new student in the system.</p>
          
          {error && <div className="bg-status-red-light dark:bg-status-red/20 border border-status-red/20 text-status-red px-4 py-3 rounded-md mb-4 font-medium" role="alert">{error}</div>}

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
                  <label htmlFor="existingStudent" className={labelClasses}>Current Student</label>
                  <ThemedSelect
                    id="existingStudent"
                    value={selectedExistingStudentId}
                    onChange={(e) => handleExistingStudentChange(e.target.value)}
                    required={isExistingStudent}
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
                    <label htmlFor="studentName" className={labelClasses}>Student Full Name</label>
                    <input 
                      type="text" 
                      id="studentName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                      placeholder="e.g., Jane Doe"
                      required 
                      readOnly={isExistingStudent}
                    />
                  </div>
                   <div>
                    <label htmlFor="age" className={labelClasses}>Age</label>
                    <input 
                      type="number" 
                      id="age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                      placeholder="e.g., 14"
                      min="1"
                      required 
                      readOnly={isExistingStudent}
                    />
                  </div>
                </div>
                 <div>
                    <label htmlFor="gender" className={labelClasses}>Gender</label>
                    <ThemedSelect 
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | '')}
                      required
                      disabled={isExistingStudent}
                      wrapperClassName={isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800' : ''}
                    >
                      <option value="" disabled>Select gender...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </ThemedSelect>
                 </div>
                {isMinor && (
                  <div className="text-xs text-status-yellow bg-status-yellow-light dark:bg-status-yellow/20 px-3 py-2 rounded-md">
                    Minor detected. Please provide guardian contact details.
                  </div>
                )}
            </fieldset>

            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
                <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Contact Details</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                       <label htmlFor="email" className={labelClasses}>Email Address</label>
                       <input 
                         type="email" 
                         id="email" 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                         placeholder="e.g., jane.doe@example.com" 
                         required 
                         readOnly={isExistingStudent}
                       />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="contactNumber" className={labelClasses}>Student's Contact Number</label>
                        <input 
                            type="tel" 
                            id="contactNumber" 
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            onBlur={() => !isExistingStudent && setContactNumber(prev => formatPhone(prev))}
                            className={`${inputClasses} ${contactPhoneError ? 'border-status-red' : ''} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                            placeholder="e.g., (555) 123-4567" 
                            required 
                            readOnly={isExistingStudent}
                        />
                        {contactPhoneError && <div className="text-xs text-status-red mt-1">{contactPhoneError}</div>}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="facebook" className={labelClasses}>Facebook (name or link)</label>
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

            {/* Guardian Details */}
            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
              <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Guardian Details</legend>
              <p className="text-sm text-text-secondary dark:text-slate-400 -mt-2">In case of emergency contact.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guardianFullName" className={labelClasses}>Full Name</label>
                  <input
                    type="text"
                    id="guardianFullName"
                    value={guardianFullName}
                    onChange={(e) => setGuardianFullName(e.target.value)}
                    className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                    placeholder="e.g., Jane D. Smith"
                    readOnly={isExistingStudent}
                  />
                </div>
                <div>
                  <label htmlFor="guardianPhone" className={labelClasses}>Phone Number</label>
                  <input
                    type="tel"
                    id="guardianPhone"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    onBlur={() => !isExistingStudent && setGuardianPhone(prev => formatPhone(prev))}
                    className={`${inputClasses} ${guardianPhoneError ? 'border-status-red' : ''} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                    placeholder="e.g., (555) 123-4567"
                    readOnly={isExistingStudent}
                  />
                  {guardianPhoneError && <div className="text-xs text-status-red mt-1">{guardianPhoneError}</div>}
                </div>
                <div>
                  <label htmlFor="guardianEmail" className={labelClasses}>Email</label>
                  <input
                    type="email"
                    id="guardianEmail"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                    placeholder="guardian@email.com"
                    readOnly={isExistingStudent}
                  />
                </div>
                <div>
                  <label htmlFor="guardianFacebook" className={labelClasses}>Facebook (name or link)</label>
                  <input
                    type="text"
                    id="guardianFacebook"
                    value={guardianFacebook}
                    onChange={(e) => setGuardianFacebook(e.target.value)}
                    className={`${inputClasses} ${isExistingStudent ? 'bg-surface-subtle dark:bg-slate-800 text-text-secondary dark:text-slate-400' : ''}`}
                    placeholder="Facebook name or https://facebook.com/..."
                    readOnly={isExistingStudent}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
                 <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Lesson Assignment</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="instrument" className={labelClasses}>Instrument</label>
                    <ThemedSelect
                      id="instrument"
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      required
                      disabled={!canAssignLesson || (isExistingStudent && availableInstrumentsForEnrollment.length === 0)}
                    >
                      <option value="" disabled>Select an instrument...</option>
                      {availableInstrumentsForEnrollment.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {isExistingStudent && !selectedExistingStudentId && (
                        <option disabled>Select an existing student first</option>
                      )}
                      {isExistingStudent && selectedExistingStudentId && availableInstrumentsForEnrollment.length === 0 && (
                        <option disabled>No new instruments available</option>
                      )}
                    </ThemedSelect>
                    {isExistingStudent && selectedExistingStudentId && (
                      <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                        Instruments the student is already enrolled in are not shown.
                      </p>
                    )}
                    {isExistingStudent && !selectedExistingStudentId && (
                      <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                        Select an existing student to choose an instrument.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="instructorId" className={labelClasses}>Assign Instructor</label>
                    <ThemedSelect
                      id="instructorId"
                      value={instructorId}
                      onChange={(e) => setInstructorId(e.target.value)}
                      required
                      disabled={!canAssignLesson || !instrument || availableInstructors.length === 0}
                    >
                      {instrument && availableInstructors.length > 0 ? (
                        availableInstructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.specialty.join(', ')})</option>)
                      ) : (
                        <option disabled>{instrument ? 'No instructors for this instrument' : 'Select an instrument first'}</option>
                      )}
                    </ThemedSelect>
                  </div>
                 </div>
            </fieldset>
          </div>
        </div>
        <div className="bg-surface-header dark:bg-slate-700/50 p-4 flex justify-end rounded-b-lg border-t border-surface-border dark:border-slate-700">
          <button 
            type="submit" 
            className="px-6 py-2 rounded-md font-semibold text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={instructors.length === 0}
          >
            {isExistingStudent ? 'Enroll in New Instrument' : 'Enroll Student'}
          </button>
        </div>
      </form>
    </Card>
  );
};