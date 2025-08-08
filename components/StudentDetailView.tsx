import React from 'react';
import type { Student, Lesson, Billing, Instructor } from '../types';
import { Card } from './Card';

interface StudentDetailViewProps {
  student: Student;
  lessons: Lesson[];
  billings: Billing[];
  instructors: Instructor[];
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

const Avatar: React.FC<{ student: Student, size: 'sm' | 'lg' }> = ({ student, size }) => {
    const sizeClasses = size === 'lg' ? 'h-20 w-20' : 'h-9 w-9';
    if (student.profilePictureUrl) {
        return <img src={student.profilePictureUrl} alt={student.name} className={`${sizeClasses} rounded-full object-cover shrink-0 border-4 border-white dark:border-slate-800 shadow-md`} />;
    }
    const initials = getInitials(student.name);
    // Simple hash to get a color
    const colorIndex = (student.name.charCodeAt(0) || 0) % 6;
    const colors = ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200'];
    const textColors = ['text-red-800', 'text-blue-800', 'text-green-800', 'text-yellow-800', 'text-purple-800', 'text-pink-800'];
    return (
        <div className={`${sizeClasses} rounded-full flex items-center justify-center shrink-0 border-4 border-white dark:border-slate-800 shadow-md ${colors[colorIndex]} ${textColors[colorIndex]}`}>
            <span className={`font-bold ${size === 'lg' ? 'text-3xl' : 'text-xs'}`}>{initials}</span>
        </div>
    );
};


const DetailItem: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
        <div>
            <span className="font-semibold text-text-primary dark:text-slate-200">{label}:</span>
            <span className="ml-2 text-text-secondary dark:text-slate-400 break-words">{value}</span>
        </div>
    );
};


export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, lessons, billings, instructors }) => {
  const instructorMap = new Map(instructors.map(i => [i.id, i]));

  return (
    <div className="bg-surface-header dark:bg-slate-900/50 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="p-4 md:col-span-2 lg:col-span-1 flex flex-col items-center text-center">
        <div className="-mt-12 mb-3">
            <Avatar student={student} size="lg" />
        </div>
        <h3 className="text-lg font-bold text-text-primary dark:text-slate-100">{student.name}</h3>
        <p className="text-sm text-text-secondary dark:text-slate-400 mb-1">ID: {student.studentIdNumber}</p>
        <p className="text-sm text-text-secondary dark:text-slate-400 mb-4">{student.instrument}</p>
        
        <div className="space-y-2.5 text-sm text-left w-full border-t border-surface-border dark:border-slate-700 pt-4">
            <DetailItem label="Gender" value={student.gender} />
            <DetailItem label="Age" value={student.age} />
            <DetailItem label="Email" value={student.email} />
            <DetailItem label="Contact" value={student.contactNumber} />
            {student.guardianName && (
                 <div className="pt-2.5 mt-2.5 border-t border-surface-border dark:border-slate-700">
                    <DetailItem label="Guardian" value={student.guardianName} />
                 </div>
            )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-base font-semibold text-text-primary dark:text-slate-100 mb-3">Scheduled Lessons</h3>
        {lessons.length > 0 ? (
          <ul className="space-y-2">
            {lessons.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(lesson => {
              const instructor = instructorMap.get(lesson.instructorId);
              // Use a regex replace to avoid timezone issues with `new Date()` from ISO string
              const lessonDate = new Date(lesson.date.replace(/-/g, '\/'));
              return (
                <li key={lesson.id} className="p-3 bg-surface-main dark:bg-slate-700/50 rounded-md border border-surface-border dark:border-slate-700">
                  <p className="text-sm font-semibold text-text-primary dark:text-slate-200">{lessonDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {lesson.time}</p>
                  <p className="text-xs text-text-secondary dark:text-slate-400">Instructor: {instructor?.name || 'N/A'}</p>
                  {lesson.notes && (
                    <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 pt-1 border-t border-surface-border dark:border-slate-600">
                      <span className="font-medium">Note:</span> {lesson.notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary dark:text-slate-400">No sessions scheduled.</p>
        )}
      </Card>
      
      <Card className="p-4">
        <h3 className="text-base font-semibold text-text-primary dark:text-slate-100 mb-3">Payment History</h3>
        {billings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-surface-border dark:border-slate-700">
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {billings.sort((a,b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime()).map(bill => (
                  <tr key={bill.id} className="border-b border-surface-border dark:border-slate-700 last:border-b-0">
                    <td className="py-2 text-sm text-text-secondary dark:text-slate-400">{new Date(bill.dateIssued).toLocaleDateString()}</td>
                    <td className="py-2 text-sm text-text-secondary dark:text-slate-400">${bill.amount.toFixed(2)}</td>
                    <td className="py-2 text-sm">
                       <span className={`px-2 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                          bill.status === 'paid' ? 'bg-status-green-light dark:bg-status-green/20 text-status-green' : 'bg-status-yellow-light dark:bg-status-yellow/20 text-status-yellow'
                      }`}>
                          <span className="capitalize">{bill.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-secondary dark:text-slate-400">No billing history found.</p>
        )}
      </Card>
    </div>
  );
};