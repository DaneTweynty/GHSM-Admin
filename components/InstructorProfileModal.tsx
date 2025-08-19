import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Instructor, Student, Lesson } from '../types';
import { Card } from './Card';

interface InstructorProfileModalProps {
  instructor: Instructor;
  students: Student[];
  lessons: Lesson[];
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>; // Optional since we're using modal
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export const InstructorProfilePopover: React.FC<InstructorProfileModalProps> = ({
  instructor,
  students,
  lessons,
  isOpen,
  onClose,
}) => {
  const [appeared, setAppeared] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      // Trigger appearance animation
      const animationFrame = requestAnimationFrame(() => {
        setAppeared(true);
      });
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
        cancelAnimationFrame(animationFrame);
      };
    } else {
      setAppeared(false);
      document.body.style.overflow = 'unset';
      return () => {}; // Return cleanup function for consistency
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate stats
  const instructorStudents = students.filter(s => s.instructorId === instructor.id && s.status === 'active');
  const _instructorLessons = lessons.filter(l => l.instructorId === instructor.id);

  // Responsive sizing
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const modal = (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          appeared ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`transform transition-all duration-200 ease-out w-full max-w-md ${
            appeared ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="instructor-profile-title"
        >
          <Card>
            <div className="max-h-[80vh] overflow-y-auto scrollbar-hidden">
              <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {instructor.profilePictureUrl ? (
                      <img 
                        src={instructor.profilePictureUrl} 
                        alt={instructor.name}
                        className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full object-cover ring-2 ring-gray-100 dark:ring-slate-600`}
                      />
                    ) : (
                      <div 
                        className={`${isMobile ? 'w-12 h-12 text-base' : 'w-16 h-16 text-xl'} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-gray-100 dark:ring-slate-600`}
                        style={{ backgroundColor: instructor.color }}
                      >
                        {getInitials(instructor.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 
                        id="instructor-profile-title"
                        className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-text-primary dark:text-slate-100 mb-2 truncate`}
                      >
                        {instructor.name}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        instructor.status === 'active' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800' 
                          : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 ring-1 ring-gray-200 dark:ring-slate-700'
                      }`}>
                        {instructor.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                    aria-label="Close profile"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Specialties */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {instructor.specialty.map((spec, index) => (
                      <span 
                        key={index}
                        className={`inline-flex items-center px-3 py-2 rounded-lg ${isMobile ? 'text-sm' : 'text-sm'} font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800`}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                {(instructor.email || instructor.phone) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Contact</h4>
                    <div className="space-y-3">
                      {instructor.email && (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm text-text-primary dark:text-slate-200 font-medium truncate">{instructor.email}</span>
                        </div>
                      )}
                      {instructor.phone && (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <span className="text-sm text-text-primary dark:text-slate-200 font-medium">{instructor.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {instructor.bio && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase tracking-wide">About</h4>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800 ring-1 ring-gray-200 dark:ring-slate-700">
                      <p className="text-sm text-text-primary dark:text-slate-200 leading-relaxed">
                        {instructor.bio}
                      </p>
                    </div>
                  </div>
                )}

                {/* Students */}
                {instructorStudents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                      Current Students ({instructorStudents.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hidden">
                      {instructorStudents.slice(0, 8).map(student => (
                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 ring-1 ring-gray-200 dark:ring-slate-700">
                          <span className="text-sm font-medium text-text-primary dark:text-slate-200 truncate mr-2">{student.name}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 flex-shrink-0">{student.instrument}</span>
                        </div>
                      ))}
                      {instructorStudents.length > 8 && (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-500 dark:text-slate-500 font-medium">
                            +{instructorStudents.length - 8} more students
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
