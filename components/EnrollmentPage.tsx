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
    guardianName?: string;
  }) => void;
  successMessage: string | null;
}

export const EnrollmentPage: React.FC<EnrollmentPageProps> = ({ instructors, onRequestEnrollment, successMessage }) => {
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('');
  const [instructorId, setInstructorId] = useState(instructors.length > 0 ? instructors[0].id : '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [guardianName, setGuardianName] = useState('');
  
  const [error, setError] = useState<string | null>(null);

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
        setGuardianName('');
    }
  }, [successMessage, instructors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !instrument.trim() || !instructorId || !age.trim() || !gender || !email.trim() || !contactNumber.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    if (isMinor && !guardianName.trim()) {
      setError("Guardian's name is required for students under 18.");
      return;
    }
    
    onRequestEnrollment({ 
        name, 
        instrument, 
        instructorId,
        age: parseInt(age, 10),
        gender: gender as 'Male' | 'Female',
        email,
        contactNumber,
        guardianName: isMinor ? guardianName : undefined,
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
                    {isMinor && (
                        <div>
                            <label htmlFor="guardianName" className={labelClasses}>Guardian's Name</label>
                            <input 
                                type="text" 
                                id="guardianName" 
                                value={guardianName}
                                onChange={(e) => setGuardianName(e.target.value)}
                                className={inputClasses}
                                placeholder="e.g., Jane Doe" 
                                required={isMinor}
                            />
                        </div>
                    )}
                    <div className={isMinor ? '' : 'md:col-span-2'}>
                        <label htmlFor="contactNumber" className={labelClasses}>
                          {isMinor ? "Guardian's Contact Number" : "Student's Contact Number"}
                        </label>
                        <input 
                            type="tel" 
                            id="contactNumber" 
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g., (555) 123-4567" 
                            required 
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