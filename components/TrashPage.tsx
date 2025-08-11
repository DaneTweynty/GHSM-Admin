import React, { useMemo } from 'react';
import type { Lesson, Student, Instructor } from '../types';
import { Card } from './Card';

interface TrashPageProps {
  deletedLessons: Lesson[];
  students: Student[];
  instructors: Instructor[];
  onRestore: (lessonId: string) => void;
  onDeletePermanently: (lessonId: string) => void;
}

const RestoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1z" />
        <path d="M4 5v2a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1zm8 0v2a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1h-1a1 1 0 00-1 1z" />
        <path fillRule="evenodd" d="M18 8H2c-.552 0-1-.448-1-1V5c0-1.105.895-2 2-2h14c1.105 0 2 .895 2 2v2c0 .552-.448 1-1 1zM2 10.5a1.5 1.5 0 01.5-2.915V6a1 1 0 112 0v1.585A1.5 1.5 0 012 10.5zm16 0a1.5 1.5 0 01-2.5-1.085V6a1 1 0 112 0v3.415A1.5 1.5 0 0118 10.5z" clipRule="evenodd" />
        <path d="M10 12a4 4 0 00-3.465 6.002A2 2 0 008.382 19h3.236a2 2 0 001.847-1.002A4 4 0 0010 12zm-2.75 4.5a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z" />
    </svg>
);

const DeleteForeverIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        <path d="M14.472 4.528a.75.75 0 00-1.06-1.06L10 6.939 6.588 3.47a.75.75 0 00-1.061 1.06L8.939 8l-3.412 3.47a.75.75 0 001.06 1.06L10 9.061l3.412 3.47a.75.75 0 001.06-1.06L11.061 8l3.41-3.472z" />
    </svg>
);


export const TrashPage: React.FC<TrashPageProps> = ({ deletedLessons, students, instructors, onRestore, onDeletePermanently }) => {
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, i])), [instructors]);

  return (
    <Card>
      <div className="p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-4">Trash</h2>
        <p className="text-sm text-text-secondary dark:text-slate-400">
          Deleted lessons are stored here. You can restore them to the calendar or delete them permanently.
        </p>
      </div>
      <div className="overflow-x-auto">
        {deletedLessons.length > 0 ? (
          <ul className="divide-y divide-surface-border dark:divide-slate-700">
            {deletedLessons.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(lesson => {
              const student = studentMap.get(lesson.studentId);
              const instructor = instructorMap.get(lesson.instructorId);

              return (
                <li key={lesson.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-surface-hover dark:hover:bg-slate-700/50 transition-colors">
                  <div>
                    <p className="font-semibold text-text-primary dark:text-slate-100">{student?.name || 'Unknown Student'}</p>
                    <p className="text-sm text-text-secondary dark:text-slate-400">
                      {new Date(lesson.date.replace(/-/g, '/')).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' at '}
                      {lesson.time}
                      {' with '}
                      {instructor?.name || 'Unknown Instructor'}
                    </p>
                    {lesson.notes && (
                      <p className="text-xs text-text-tertiary dark:text-slate-500 mt-1">Note: {lesson.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onRestore(lesson.id)}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-semibold text-text-primary dark:text-brand-primary bg-brand-primary-light dark:bg-brand-primary/20 hover:bg-black/5 dark:hover:bg-brand-primary/30 transition-colors"
                      aria-label={`Restore lesson for ${student?.name}`}
                    >
                      <RestoreIcon />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => onDeletePermanently(lesson.id)}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-semibold text-status-red bg-status-red-light dark:bg-status-red/20 hover:bg-status-red/20 dark:hover:bg-status-red/30 transition-colors"
                      aria-label={`Permanently delete lesson for ${student?.name}`}
                    >
                      <DeleteForeverIcon />
                      <span>Delete Forever</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-surface-header dark:bg-slate-700/50 rounded-full">
              <div className="inline-block p-3 bg-surface-main dark:bg-slate-800 rounded-full">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-text-tertiary dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
            </div>
            <p className="mt-4 text-lg font-semibold text-text-primary dark:text-slate-200">The trash is empty</p>
            <p className="text-sm text-text-secondary dark:text-slate-400">Drag lessons to the trash can on the calendar to delete them.</p>
          </div>
        )}
      </div>
    </Card>
  );
};
