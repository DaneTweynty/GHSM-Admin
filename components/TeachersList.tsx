import React, { useState, useRef } from 'react';
import type { Instructor, Student, Lesson } from '../types';
import { Card } from './Card';
import { TeacherDetailView } from './TeacherDetailView';
import { InstructorProfilePopover } from './InstructorProfilePopover';
import { ICONS } from '../constants';

interface TeachersListProps {
  instructors: Instructor[];
  students: Student[];
  lessons: Lesson[];
  onMarkAttendance: (studentId: string) => void;
  onEditInstructor: (instructor: Instructor) => void;
  onAddInstructor: () => void;
  onToggleInstructorStatus: (instructorId: string) => void;
}

const getInitials = (name: string) => {
    const names = name.split(' ').filter(Boolean);
    if (names.length === 0) return 'N/A';
    if (names.length === 1) return names[0]!.charAt(0).toUpperCase();
    return (names[0]!.charAt(0) + names[names.length - 1]!.charAt(0)).toUpperCase();
};

const InstructorAvatar: React.FC<{ instructor: Instructor }> = ({ instructor }) => {
    if (instructor.profilePictureUrl) {
        return <img src={instructor.profilePictureUrl} alt={instructor.name} className="h-9 w-9 rounded-full object-cover shrink-0" />;
    }
    const initials = getInitials(instructor.name);
    return (
        <div 
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-text-primary dark:text-slate-800"
            style={{ backgroundColor: instructor.color, border: '1px solid rgba(0,0,0,0.1)' }}
            title={instructor.name}
        >
            <span className="text-xs font-bold">{initials}</span>
        </div>
    );
};


export const TeachersList: React.FC<TeachersListProps> = ({ instructors, students, lessons, onMarkAttendance, onEditInstructor, onAddInstructor, onToggleInstructorStatus }) => {
  const [expandedInstructorId, setExpandedInstructorId] = useState<string | null>(null);
  const [profilePopoverInstructorId, setProfilePopoverInstructorId] = useState<string | null>(null);
  const infoButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const handleToggleDetails = (instructorId: string) => {
    setExpandedInstructorId(prevId => (prevId === instructorId ? null : instructorId));
  };

  const handleShowProfile = (instructorId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setProfilePopoverInstructorId(instructorId);
  };

  const handleCloseProfile = () => {
    setProfilePopoverInstructorId(null);
  };

  return (
    <Card>
      <div className="p-4 sm:p-6 flex justify-between items-center">
       <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary">Instructor Roster</h2>
       <button
         onClick={onAddInstructor}
         className="flex items-center space-x-2 px-4 py-2 rounded-md font-semibold text-sm text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity"
       >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
           <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
         </svg>
         <span>Add Instructor</span>
       </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-border dark:divide-slate-700">
          <thead className="bg-surface-table-header dark:bg-slate-700 hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Instructor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Specialty</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-card dark:bg-slate-800 divide-y divide-surface-border dark:divide-slate-700">
            {[...instructors].sort((a, b) => a.name.localeCompare(b.name)).map((instructor) => {
                const isExpanded = expandedInstructorId === instructor.id;
                return (
                    <React.Fragment key={instructor.id}>
                        <tr className={`block md:table-row hover:bg-surface-hover dark:hover:bg-slate-700/50 transition-all duration-300 ${instructor.status === 'inactive' ? 'opacity-60' : ''}`}>
                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell">
                                <div className="flex items-center justify-between w-full">
                                  <button onClick={() => handleToggleDetails(instructor.id)} className="flex items-center text-left group flex-1">
                                      <InstructorAvatar instructor={instructor} />
                                      <div className="ml-4 text-sm font-medium text-text-primary dark:text-slate-100 group-hover:text-brand-primary transition-colors">{instructor.name}</div>
                                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-auto text-text-tertiary dark:text-slate-500 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                  <button
                                    ref={el => {
                                      if (el) {
                                        infoButtonRefs.current[instructor.id] = el;
                                      }
                                    }}
                                    onClick={(e) => handleShowProfile(instructor.id, e)}
                                    className="ml-2 p-1 rounded-full text-text-tertiary hover:text-brand-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
                                    aria-label={`View ${instructor.name} profile`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                </div>
                            </td>
                            <td data-label="Specialty" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left text-text-primary dark:text-slate-100">
                                <div className="text-sm text-text-secondary dark:text-slate-300">
                                  <div className="flex flex-wrap gap-1 justify-end md:justify-start">
                                    {Array.isArray(instructor.specialty) ? (
                                      instructor.specialty.slice(0, 2).map((spec, index) => (
                                        <span 
                                          key={index}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-primary/10 text-brand-primary dark:bg-brand-secondary/20 dark:text-brand-secondary"
                                        >
                                          {spec}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm">{instructor.specialty}</span>
                                    )}
                                    {Array.isArray(instructor.specialty) && instructor.specialty.length > 2 && (
                                      <span className="text-xs text-text-tertiary dark:text-slate-500">
                                        +{instructor.specialty.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                            </td>
                            <td data-label="Status" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left text-text-primary dark:text-slate-100">
                                <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full capitalize ${
                                    instructor.status === 'active' 
                                    ? 'bg-status-green-light dark:bg-status-green/20 text-status-green' 
                                    : 'bg-surface-input dark:bg-slate-700 text-text-secondary dark:text-slate-400'
                                }`}>
                                    {instructor.status}
                                </span>
                            </td>
                             <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-right text-sm font-medium block md:table-cell">
                                <div className="flex items-center justify-end space-x-2">
                                    <button
                                        onClick={() => onEditInstructor(instructor)}
                                        className="p-2 rounded-md text-text-secondary dark:text-slate-400 hover:bg-surface-hover dark:hover:bg-slate-700 hover:text-text-primary dark:hover:text-slate-200 transition-colors"
                                        aria-label={`Edit ${instructor.name}`}
                                    >
                                        {ICONS.edit}
                                    </button>
                                     <button
                                      onClick={() => onToggleInstructorStatus(instructor.id)}
                                      className={`w-24 text-center px-3 py-1 rounded-md transition-colors font-semibold text-xs ${
                                        instructor.status === 'active'
                                          ? 'bg-status-yellow-light dark:bg-status-yellow/20 text-text-primary dark:text-status-yellow hover:bg-black/5 dark:hover:bg-status-yellow/30'
                                          : 'bg-status-green-light dark:bg-status-green/20 text-text-primary dark:text-status-green hover:bg-black/5 dark:hover:bg-status-green/30'
                                      }`}
                                    >
                                      {instructor.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                        {isExpanded && (
                            <tr className="block md:table-row">
                                <td colSpan={4} className="p-0 block md:table-cell">
                                    <TeacherDetailView
                                        instructor={instructor}
                                        allLessons={lessons}
                                        allStudents={students}
                                        onMarkAttendance={onMarkAttendance}
                                    />
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Profile Popover */}
      {profilePopoverInstructorId && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={handleCloseProfile}
          />
          <InstructorProfilePopover
            instructor={instructors.find(i => i.id === profilePopoverInstructorId)!}
            students={students}
            lessons={lessons}
            isOpen={true}
            onClose={handleCloseProfile}
            anchorRef={{ current: infoButtonRefs.current[profilePopoverInstructorId] || null }}
          />
        </>
      )}
    </Card>
  );
};

export default React.memo(TeachersList);