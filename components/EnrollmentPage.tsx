import React, { useState, useEffect } from 'react';
import type { Instructor } from '../types';
import { Card } from './Card';

interface EnrollmentPageProps {
  instructors: Instructor[];
  onRequestEnrollment: (studentData: { 
    name: string; 
    instrument: string; 
    instructorId: string; 
    age: number;
    email: string;
    contactNumber: string;
    gender: 'Male' | 'Female';
    // Student facebook (optional)
    facebook?: string;
    guardianName?: string;
    // Additional guardian details
    guardianFullName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianFacebook?: string;
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

export const EnrollmentPage: React.FC<EnrollmentPageProps> = ({ instructors, onRequestEnrollment, successMessage }) => {
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
  
  useEffect(() => {
    // When a success message comes from the parent, clear the form.
    if (successMessage) {
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
    });
  };
  
  const inputClasses = "w-full bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-2 text-text-primary dark:text-slate-100 focus:ring-brand-primary dark:focus:ring-brand-secondary focus:border-brand-primary dark:focus:border-brand-secondary";
  const labelClasses = "block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1";

  return (
    <Card className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary mb-2">New Student Enrollment</h2>
          <p className="text-text-secondary dark:text-slate-400 mb-6">Fill out the form below to register a new student in the system.</p>
          
          {error && <div className="bg-status-red-light dark:bg-status-red/20 border border-status-red/20 text-status-red px-4 py-3 rounded-md mb-4 font-medium" role="alert">{error}</div>}
          {successMessage && <div className="bg-status-green-light dark:bg-status-green/20 border border-status-green/20 text-status-green px-4 py-3 rounded-md mb-4 font-medium" role="alert">{successMessage}</div>}

          <div className="space-y-8">
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
                      className={inputClasses}
                      placeholder="e.g., John Doe" 
                      required 
                    />
                  </div>
                   <div>
                    <label htmlFor="age" className={labelClasses}>Age</label>
                    <input 
                      type="number" 
                      id="age" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className={inputClasses}
                      placeholder="e.g., 14"
                      min="1"
                      required 
                    />
                  </div>
                </div>
                 <div>
                    <label htmlFor="gender" className={labelClasses}>Gender</label>
                    <select 
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | '')}
                        className={inputClasses}
                        required
                    >
                        <option value="" disabled>Select gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
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
                         className={inputClasses}
                         placeholder="e.g., jane.doe@example.com" 
                         required 
                       />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="contactNumber" className={labelClasses}>Student's Contact Number</label>
                        <input 
                            type="tel" 
                            id="contactNumber" 
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            onBlur={() => setContactNumber(prev => formatPhone(prev))}
                            className={`${inputClasses} ${contactPhoneError ? 'border-status-red' : ''}`}
                            placeholder="e.g., (555) 123-4567" 
                            required 
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
                            className={inputClasses}
                            placeholder="Facebook name or https://facebook.com/..." 
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
                    className={inputClasses}
                    placeholder="e.g., Jane D. Smith"
                  />
                </div>
                <div>
                  <label htmlFor="guardianPhone" className={labelClasses}>Phone Number</label>
                  <input
                    type="tel"
                    id="guardianPhone"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    onBlur={() => setGuardianPhone(prev => formatPhone(prev))}
                    className={`${inputClasses} ${guardianPhoneError ? 'border-status-red' : ''}`}
                    placeholder="e.g., (555) 123-4567"
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
                    className={inputClasses}
                    placeholder="guardian@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="guardianFacebook" className={labelClasses}>Facebook (name or link)</label>
                  <input
                    type="text"
                    id="guardianFacebook"
                    value={guardianFacebook}
                    onChange={(e) => setGuardianFacebook(e.target.value)}
                    className={inputClasses}
                    placeholder="Facebook name or https://facebook.com/..."
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
                 <legend className="text-lg font-semibold text-text-primary dark:text-slate-200 px-2">Lesson Assignment</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="instrument" className={labelClasses}>Instrument</label>
                    <input 
                      type="text" 
                      id="instrument" 
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      className={inputClasses}
                      placeholder="e.g., Guitar" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="instructorId" className={labelClasses}>Assign Instructor</label>
                    <select 
                      id="instructorId" 
                      value={instructorId}
                      onChange={(e) => setInstructorId(e.target.value)}
                      className={inputClasses}
                      required
                    >
                      {instructors.length > 0 ? (
                        instructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.specialty})</option>)
                      ) : (
                        <option disabled>No instructors available</option>
                      )}
                    </select>
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
            Enroll Student
          </button>
        </div>
      </form>
    </Card>
  );
};