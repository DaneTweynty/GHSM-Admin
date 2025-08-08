import React, { useState } from 'react';
import type { Instructor, Student, Lesson } from '../types';
import { Card } from './Card';
import { TeacherDetailView } from './TeacherDetailView';
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
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
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

  const handleToggleDetails = (instructorId: string) => {
    setExpandedInstructorId(prevId => (prevId === instructorId ? null : instructorId));
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
                                <button onClick={() => handleToggleDetails(instructor.id)} className="flex items-center w-full text-left group">
                                    <InstructorAvatar instructor={instructor} />
                                    <div className="ml-4 text-sm font-medium text-text-primary dark:text-slate-100 group-hover:text-brand-primary transition-colors">{instructor.name}</div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-auto text-text-tertiary dark:text-slate-500 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </td>
                            <td data-label="Specialty" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left text-text-primary dark:text-slate-100">
                                <div className="text-sm text-text-secondary dark:text-slate-300">{instructor.specialty}</div>
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
    </Card>
  );
};