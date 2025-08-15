import React from 'react';
import { Card } from './Card';
import { LoadingSpinner } from './LoadingSpinner';
import { useAttendanceByLesson, useAttendanceByStudent } from '../hooks/useSupabase';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '../utils/database.types';

type Tables = Database['public']['Tables'];
type AttendanceRecord = Tables['attendance_records']['Row'];

interface AttendanceViewProps {
  lessonId?: string;
  studentId?: string;
  title?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  lessonId,
  studentId,
  title
}) => {
  // Get attendance data based on what's provided
  const { data: lessonAttendance, isLoading: isLoadingLesson } = useAttendanceByLesson(
    lessonId || ''
  );
  
  const { data: studentAttendance, isLoading: isLoadingStudent } = useAttendanceByStudent(
    studentId || ''
  );

  const attendanceData = lessonId ? lessonAttendance : studentAttendance;
  const isLoading = lessonId ? isLoadingLesson : isLoadingStudent;

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'present':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'absent':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'late':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'excused':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const calculateAttendanceStats = (records: AttendanceRecord[]) => {
    if (!records || records.length === 0) return null;
    
    const stats = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = records.length;
    const present = (stats.present || 0) + (stats.late || 0); // Late still counts as attended
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { stats, total, present, percentage };
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-2">Loading attendance data...</span>
        </div>
      </Card>
    );
  }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {title || 'Attendance Records'}
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <p className="text-gray-600">No attendance records found</p>
          <p className="text-sm text-gray-500 mt-2">
            {lessonId 
              ? 'Attendance has not been marked for this lesson yet.'
              : 'This student has no attendance records yet.'
            }
          </p>
        </div>
      </Card>
    );
  }

  const stats = calculateAttendanceStats(attendanceData);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">
          {title || 'Attendance Records'}
        </h3>
        {stats && (
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">
              Total: {stats.total}
            </span>
            <span className="text-gray-600">
              Present: {stats.present}
            </span>
            <span className={`font-medium ${
              stats.percentage >= 90 ? 'text-green-600' :
              stats.percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {stats.percentage}% attendance
            </span>
          </div>
        )}
      </div>

      {stats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.stats.present || 0}
              </div>
              <div className="text-xs text-gray-600">Present</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {stats.stats.late || 0}
              </div>
              <div className="text-xs text-gray-600">Late</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {stats.stats.absent || 0}
              </div>
              <div className="text-xs text-gray-600">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {stats.stats.excused || 0}
              </div>
              <div className="text-xs text-gray-600">Excused</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {attendanceData.map((record: AttendanceRecord & { 
          students?: { id: string; name: string };
          lessons?: { id: string; title: string; start_time: string; instructors?: { id: string; name: string } };
        }) => (
          <div key={record.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {lessonId ? (
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {record.students?.name || 'Unknown Student'}
                    </h4>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {record.lessons?.title || 'Unknown Lesson'}
                    </h4>
                    {record.lessons?.start_time && (
                      <p className="text-sm text-gray-600">
                        {new Date(record.lessons.start_time).toLocaleDateString()} at{' '}
                        {new Date(record.lessons.start_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    )}
                    {record.lessons?.instructors?.name && (
                      <p className="text-sm text-gray-500">
                        Instructor: {record.lessons.instructors.name}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-3 mt-2">
                  <span className={getStatusBadge(record.status)}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Marked {formatDistanceToNow(new Date(record.marked_at), { addSuffix: true })}
                  </span>
                </div>

                {record.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
