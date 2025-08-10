import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Instructor, Student, Lesson } from '../types';
import { Card } from './Card';

interface InstructorProfilePopoverProps {
  instructor: Instructor;
  students: Student[];
  lessons: Lesson[];
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export const InstructorProfilePopover: React.FC<InstructorProfilePopoverProps> = ({
  instructor,
  students,
  lessons,
  isOpen,
  onClose,
  anchorRef
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [appeared, setAppeared] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const computePosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const popoverWidth = 320; // w-80
    const maxPopoverHeight = Math.min(window.innerHeight * 0.7, 450); // 70% of viewport or 450px max
    
    let left = rect.right + 8; // Default to right side
    let top = rect.top;

    // Check if popover would go off screen on the right
    if (left + popoverWidth > window.innerWidth - 16) {
      left = rect.left - popoverWidth - 8; // Switch to left side
    }

    // Check if popover would go off screen on the left
    if (left < 16) {
      left = 16; // Keep some margin from edge
    }

    // Better vertical positioning
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= maxPopoverHeight + 16) {
      // Enough space below, position below the anchor
      top = rect.bottom + 8;
    } else if (spaceAbove >= maxPopoverHeight + 16) {
      // Not enough space below but enough above, position above
      top = rect.top - maxPopoverHeight - 8;
    } else {
      // Not enough space either way, position to fit in viewport
      if (spaceBelow > spaceAbove) {
        // More space below, position below but constrain height
        top = rect.bottom + 8;
      } else {
        // More space above, position above but constrain height  
        top = Math.max(16, rect.top - maxPopoverHeight - 8);
      }
    }

    // Ensure popover doesn't go off the top or bottom
    top = Math.max(16, Math.min(top, viewportHeight - maxPopoverHeight - 16));

    setPosition({ top: top + window.scrollY, left: left + window.scrollX });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      computePosition();
      const handleResize = () => computePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      setTimeout(() => setAppeared(true), 0);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
      };
    } else {
      setAppeared(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate stats
  const instructorStudents = students.filter(s => s.instructorId === instructor.id && s.status === 'active');
  const instructorLessons = lessons.filter(l => l.instructorId === instructor.id);
  const weeklyLessons = instructorLessons.length; // This is a simplified count

  const popover = (
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: position.top, left: position.left, width: 320, zIndex: 9999 }}
      className={`transform transition-all duration-200 ease-out ${
        appeared ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } max-h-[70vh] overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
    >
      <Card>
        <div className="max-h-[65vh] overflow-y-auto thin-scroll">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                {instructor.profilePictureUrl ? (
                  <img 
                    src={instructor.profilePictureUrl} 
                    alt={instructor.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-slate-600"
                  />
                ) : (
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-gray-100 dark:ring-slate-600"
                    style={{ backgroundColor: instructor.color }}
                  >
                    {getInitials(instructor.name)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary dark:text-slate-100 mb-2">
                    {instructor.name}
                  </h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
                className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800"
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
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-slate-800">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm text-text-primary dark:text-slate-200 font-medium">{instructor.email}</span>
                    </div>
                  )}
                  {instructor.phone && (
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-slate-800">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <span className="text-sm text-text-primary dark:text-slate-200 font-medium">{instructor.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl ring-1 ring-purple-200 dark:ring-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{instructorStudents.length}</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Active Students</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl ring-1 ring-orange-200 dark:ring-orange-800">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{weeklyLessons}</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">Total Lessons</div>
                </div>
              </div>
            </div>

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
                <div className="space-y-2 max-h-32 overflow-y-auto thin-scroll">
                  {instructorStudents.slice(0, 5).map(student => (
                    <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800 ring-1 ring-gray-200 dark:ring-slate-700">
                      <span className="text-sm font-medium text-text-primary dark:text-slate-200">{student.name}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400">{student.instrument}</span>
                    </div>
                  ))}
                  {instructorStudents.length > 5 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-500 dark:text-slate-500 font-medium">
                        +{instructorStudents.length - 5} more students
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
  );

  return createPortal(popover, document.body);
};
