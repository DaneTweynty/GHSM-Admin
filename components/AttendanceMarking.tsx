import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { LoadingSpinner } from './LoadingSpinner';
import { useAttendanceByLesson, useBulkCreateAttendance, useSessionSummaryByLesson } from '../hooks/useSupabase';
import { sanitizeText } from '../utils/securityUtils';
import type { Database } from '../utils/database.types';

type Tables = Database['public']['Tables'];
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceMarkingProps {
  lessonId: string;
  students: Array<{
    id: string;
    name: string;
  }>;
  onClose: () => void;
  currentUserId: string; // Instructor or admin marking attendance
}

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
  notes: string;
}

export const AttendanceMarking: React.FC<AttendanceMarkingProps> = ({
  lessonId,
  students,
  onClose,
  currentUserId
}) => {
  const [attendanceData, setAttendanceData] = useState<Map<string, StudentAttendance>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get existing attendance and session summary
  const { data: existingAttendance, isLoading } = useAttendanceByLesson(lessonId);
  const { data: sessionSummary } = useSessionSummaryByLesson(lessonId);
  
  const bulkCreateAttendance = useBulkCreateAttendance();

  // Initialize attendance data
  useEffect(() => {
    const initialData = new Map<string, StudentAttendance>();
    
    students.forEach(student => {
      const existing = existingAttendance?.find(record => record.student_id === student.id);
      initialData.set(student.id, {
        studentId: student.id,
        status: (existing?.status as AttendanceStatus) || 'present',
        notes: existing?.notes || ''
      });
    });
    
    setAttendanceData(initialData);
  }, [students, existingAttendance]);

  const updateStudentAttendance = (studentId: string, field: keyof StudentAttendance, value: string) => {
    setAttendanceData(prev => {
      const newData = new Map(prev);
      const current = newData.get(studentId) || { studentId, status: 'present', notes: '' };
      newData.set(studentId, { ...current, [field]: value });
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!sessionSummary) {
      setError('Cannot mark attendance: A session summary must be created first. Please complete the session summary before marking attendance.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const attendanceRecords: Tables['attendance_records']['Insert'][] = Array.from(attendanceData.values()).map(data => ({
        lesson_id: lessonId,
        student_id: data.studentId,
        status: data.status,
        marked_at: new Date().toISOString(),
        marked_by: currentUserId,
        notes: data.notes ? sanitizeText(data.notes) : null
      }));

      await bulkCreateAttendance.mutateAsync(attendanceRecords);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96 p-6">
          <LoadingSpinner size="md" />
          <p className="text-center mt-4">Loading attendance data...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Mark Attendance</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {!sessionSummary && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Session Summary Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You must create a session summary before marking attendance. 
                      This ensures that lesson content is documented before tracking student presence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {students.map(student => {
              const attendance = attendanceData.get(student.id);
              if (!attendance) return null;

              return (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{student.name}</h3>
                    <div className="flex space-x-2">
                      {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => updateStudentAttendance(student.id, 'status', status)}
                          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                            attendance.status === status 
                              ? getStatusColor(status)
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={attendance.notes}
                      onChange={(e) => updateStudentAttendance(student.id, 'notes', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Add any notes about this student's attendance..."
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !sessionSummary}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && (
                <div className="w-4 h-4 mr-2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              {isSubmitting ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
