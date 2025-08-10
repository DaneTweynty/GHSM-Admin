import React, { useMemo, useState } from 'react';
import { control } from './ui';
import type { Student, Instructor, Lesson, Billing } from '../types';
import { Card } from './Card';
import { ICONS, BILLING_CYCLE } from '../constants';
import { StudentDetailView } from './StudentDetailView';

interface StudentsListProps {
  students: Student[];
  instructors: Instructor[];
  lessons: Lesson[];
  billings: Billing[];
  onMarkAttendance: (studentId: string) => void;
  onToggleStatus: (studentId: string) => void;
  onEditSessions: (student: Student) => void;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

const Avatar: React.FC<{ student: Student }> = ({ student }) => {
    if (student.profilePictureUrl) {
        return <img src={student.profilePictureUrl} alt={student.name} className="h-9 w-9 rounded-full object-cover shrink-0" />;
    }
    const initials = getInitials(student.name);
    // Simple hash to get a color - not a real instructor color
    const colorIndex = (student.name.charCodeAt(0) || 0) % 6;
    const colors = ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200'];
    const textColors = ['text-red-800', 'text-blue-800', 'text-green-800', 'text-yellow-800', 'text-purple-800', 'text-pink-800'];
    return (
        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${colors[colorIndex]} ${textColors[colorIndex]}`}>
            <span className="text-xs font-bold">{initials}</span>
        </div>
    );
};

export const StudentsList: React.FC<StudentsListProps> = ({ students, instructors, lessons, billings, onMarkAttendance, onToggleStatus, onEditSessions }) => {
  const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, i])), [instructors]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleDetails = (studentId: string) => {
    setExpandedStudentId(prevId => (prevId === studentId ? null : studentId));
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students;
    }
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  return (
    <Card>
      <div className="p-4 sm:p-6">
       <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary mb-4">Student Roster</h2>
        <div className="mb-4">
          <label htmlFor="student-search" className="sr-only">Search Students</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-text-tertiary dark:text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              name="student-search"
              id="student-search"
              className={`${control} pl-10 sm:text-sm`}
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-border dark:divide-slate-700 md:table">
          <thead className="bg-surface-table-header dark:bg-slate-700 hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Instrument</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Instructor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Session Progress</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-card dark:bg-slate-800 divide-y divide-surface-border dark:divide-slate-700 md:divide-y-0">
            {[...filteredStudents].sort((a, b) => a.name.localeCompare(b.name)).map((student) => {
              const instructor = instructorMap.get(student.instructorId || '');
              const isExpanded = expandedStudentId === student.id;

              // Check if student has a lesson today
              const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
              const hasLessonToday = lessons.some(lesson => 
                lesson.studentId === student.id && 
                lesson.date === today && 
                lesson.status === 'active'
              );

              const now = Date.now();
              const twentyFourHours = 24 * 60 * 60 * 1000;
              const wasAttendedRecently = student.lastAttendanceMarkedAt && (now - student.lastAttendanceMarkedAt < twentyFourHours);
              
              const unpaidSessions = student.sessionsAttended - student.sessionsBilled;

              let sessionsForProgressBar = unpaidSessions % BILLING_CYCLE;
              if (sessionsForProgressBar === 0 && unpaidSessions > 0) {
                sessionsForProgressBar = BILLING_CYCLE;
              }
              
              const progressPercentage = Math.min((sessionsForProgressBar / BILLING_CYCLE) * 100, 100);

              return (
                <React.Fragment key={student.id}>
                  <tr className="block md:table-row hover:bg-surface-hover dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell">
                      <button onClick={() => handleToggleDetails(student.id)} className="flex items-center w-full text-left group">
                         <div className="relative mr-4">
                            <Avatar student={student} />
                            {student.status === 'active' ? (
                              <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-status-green ring-2 ring-white dark:ring-slate-800" title="Active student"></span>
                            ) : (
                               <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-text-tertiary dark:bg-slate-500 ring-2 ring-white dark:ring-slate-800" title="Inactive student"></span>
                            )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary dark:text-slate-100 group-hover:text-brand-primary dark:group-hover:text-brand-primary transition-colors">{student.name}</div>
                          <div className="text-xs text-text-tertiary dark:text-slate-500">ID: {student.studentIdNumber}</div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-auto text-text-tertiary dark:text-slate-500 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </td>
                    <td data-label="Instrument" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left text-text-primary dark:text-slate-100">
                      <div className="text-sm text-text-secondary dark:text-slate-300">{student.instrument}</div>
                    </td>
                    <td data-label="Instructor" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left text-text-primary dark:text-slate-100">
                      {instructor ? (
                        <div className="flex items-center justify-end md:justify-start">
                          <span 
                            className="h-4 w-4 rounded-full mr-2.5 border border-black/10 dark:border-white/10" 
                            style={{ backgroundColor: instructor.color }}
                            title={`Color code for ${instructor.name}`}
                          ></span>
                          <div className="text-sm text-text-secondary dark:text-slate-300">{instructor.name}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-text-tertiary dark:text-slate-500">Unassigned</div>
                      )}
                    </td>
                    <td data-label="Progress" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 md:before:content-none before:float-left before:pt-5 text-text-primary dark:text-slate-100">
                       <button
                          onClick={() => onEditSessions(student)}
                          className="w-full text-left p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-brand-primary dark:focus:ring-brand-secondary transition-all duration-150 group"
                          aria-label={`Edit session count for ${student.name}. Current total: ${student.sessionsAttended}.`}
                       >
                         <div className="flex items-center space-x-4 justify-end md:justify-start">
                            <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-base font-bold rounded-full transition-colors ${
                                unpaidSessions > 0
                                  ? 'bg-brand-primary-light dark:bg-brand-primary/20 text-text-primary dark:text-brand-primary'
                                  : 'bg-surface-input dark:bg-slate-700 text-text-secondary dark:text-slate-400'
                            }`}
                            title={`Unpaid sessions: ${unpaidSessions}`}>
                              {unpaidSessions}
                            </div>
                            <div className="w-full">
                                <div className="w-full bg-surface-input dark:bg-slate-700 rounded-full h-2.5" title={`${sessionsForProgressBar} out of ${BILLING_CYCLE} sessions in this cycle`}>
                                    <div 
                                        className={`h-2.5 rounded-full transition-all duration-500 ${unpaidSessions >= BILLING_CYCLE ? 'bg-status-yellow' : 'bg-brand-primary'}`}
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                       </button>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-right text-sm font-medium block md:table-cell">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onToggleStatus(student.id)}
                          className={`w-24 text-center px-3 py-1 rounded-md transition-colors font-semibold text-xs ${
                            student.status === 'active'
                              ? 'bg-status-yellow-light dark:bg-status-yellow/20 text-text-primary dark:text-status-yellow hover:bg-black/5 dark:hover:bg-status-yellow/30'
                              : 'bg-status-green-light dark:bg-status-green/20 text-text-primary dark:text-status-green hover:bg-black/5 dark:hover:bg-status-green/30'
                          }`}
                        >
                          {student.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => onMarkAttendance(student.id)}
                          disabled={!hasLessonToday || wasAttendedRecently || student.status === 'inactive'}
                          className={`flex items-center justify-center space-x-1.5 px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                            !hasLessonToday || wasAttendedRecently || student.status === 'inactive'
                              ? 'bg-surface-input dark:bg-slate-700 text-text-tertiary dark:text-slate-500 cursor-not-allowed'
                              : 'bg-brand-primary-light dark:bg-brand-primary/20 text-text-primary dark:text-brand-primary hover:bg-black/5 dark:hover:bg-brand-primary/30'
                          }`}
                        >
                          {ICONS.check}
                          <span>
                            {wasAttendedRecently ? 'Attended' : !hasLessonToday ? 'No Lesson Today' : 'Attend'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="block md:table-row">
                      <td colSpan={5} className="p-0 block md:table-cell">
                        <StudentDetailView
                          student={student}
                          lessons={lessons.filter(l => l.studentId === student.id)}
                          billings={billings.filter(b => b.studentId === student.id)}
                          instructors={instructors}
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