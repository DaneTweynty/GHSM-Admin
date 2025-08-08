
import React, { useMemo } from 'react';
import type { Instructor, Lesson, Student } from '../types';
import { ICONS, toYYYYMMDD } from '../constants';

interface TeacherDetailViewProps {
  instructor: Instructor;
  allLessons: Lesson[];
  allStudents: Student[];
  onMarkAttendance: (studentId: string) => void;
}

export const TeacherDetailView: React.FC<TeacherDetailViewProps> = ({ instructor, allLessons, allStudents, onMarkAttendance }) => {
  const studentMap = useMemo(() => new Map(allStudents.map(s => [s.id, s])), [allStudents]);
  
  const todaysLessons = useMemo(() => {
    const todayString = toYYYYMMDD(new Date());
    return allLessons
      .filter(lesson => lesson.instructorId === instructor.id && lesson.date === todayString)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [allLessons, instructor.id]);

  return (
    <div className="bg-surface-header dark:bg-slate-900/50 p-4">
      <h4 className="text-md font-semibold text-text-primary dark:text-slate-200 mb-3">Today's Schedule for {instructor.name}</h4>
      {todaysLessons.length > 0 ? (
        <ul className="space-y-2">
          {todaysLessons.map(lesson => {
            const student = studentMap.get(lesson.studentId);
            if (!student) return null;

            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            const wasAttendedRecently = student.lastAttendanceMarkedAt && (now - student.lastAttendanceMarkedAt < twentyFourHours);

            return (
              <li key={lesson.id} className="flex items-center justify-between p-3 bg-surface-card dark:bg-slate-800 rounded-md border border-surface-border dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-text-secondary dark:text-slate-400">{lesson.time}</span>
                  <span className="font-semibold text-text-primary dark:text-slate-100">{student.name}</span>
                  <span className="text-xs text-text-secondary dark:text-slate-400">{student.instrument}</span>
                </div>
                <button
                  onClick={() => onMarkAttendance(student.id)}
                  disabled={wasAttendedRecently || student.status === 'inactive'}
                  className={`flex items-center justify-center space-x-1.5 w-28 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                    wasAttendedRecently
                      ? 'bg-status-green-light dark:bg-status-green/20 text-status-green cursor-not-allowed'
                      : 'bg-brand-primary-light dark:bg-brand-primary/20 text-text-primary dark:text-brand-primary hover:bg-black/5 dark:hover:bg-brand-primary/30 disabled:bg-surface-input dark:disabled:bg-slate-700 disabled:text-text-tertiary dark:disabled:text-slate-500 disabled:cursor-not-allowed'
                  }`}
                >
                  {ICONS.check}
                  <span>{wasAttendedRecently ? 'Done' : 'Confirm'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary dark:text-slate-400 text-center py-4">No lessons scheduled for today.</p>
      )}
    </div>
  );
};
