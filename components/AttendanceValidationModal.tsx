import React, { useState, useMemo } from 'react';
import { format, isPast, addDays } from 'date-fns';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Save,
  RotateCcw
} from 'lucide-react';
import type { Lesson, Student } from '../types';
import { useErrorHandler } from '../utils/errorHandling';
import { useOfflineSync } from '../utils/offlineSync';

interface AttendanceRecord {
  lessonId: string;
  studentId: string;
  studentName: string;
  lessonDate: string;
  lessonTime: string;
  currentStatus: 'present' | 'absent' | 'late' | 'excused' | 'pending';
  newStatus: 'present' | 'absent' | 'late' | 'excused' | 'pending';
  canModify: boolean;
  isModified: boolean;
  notes?: string;
}

interface AttendanceValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  students: Student[];
  selectedDate?: Date;
  calendarView: 'day' | 'week' | 'month' | 'year';
  currentDate: Date;
}

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  severity: 'error' | 'warning' | 'info';
}

const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'future_attendance',
    name: 'Future Date Attendance',
    description: 'Prevent marking attendance for future lessons',
    isActive: true,
    severity: 'error'
  },
  {
    id: 'late_marking',
    name: 'Late Attendance Marking',
    description: 'Warn when marking attendance more than 24 hours after lesson',
    isActive: true,
    severity: 'warning'
  },
  {
    id: 'duplicate_marking',
    name: 'Duplicate Marking',
    description: 'Prevent multiple attendance changes in same day',
    isActive: true,
    severity: 'error'
  },
  {
    id: 'weekend_lessons',
    name: 'Weekend Lesson Validation',
    description: 'Confirm attendance for weekend lessons',
    isActive: true,
    severity: 'info'
  },
  {
    id: 'consecutive_absences',
    name: 'Consecutive Absences',
    description: 'Alert when student has 3+ consecutive absences',
    isActive: true,
    severity: 'warning'
  }
];

export const AttendanceValidationModal: React.FC<AttendanceValidationModalProps> = ({
  isOpen,
  onClose,
  lessons,
  students,
  selectedDate,
  calendarView,
  currentDate
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>(DEFAULT_VALIDATION_RULES);
  const [activeTab, setActiveTab] = useState<'attendance' | 'validation' | 'bulk'>('attendance');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{
    recordId: string;
    rule: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>>([]);

  const { reportError } = useErrorHandler();
  const { queueOperation } = useOfflineSync();
  
  // Placeholder mutation hooks - these would be implemented in useSupabase.ts
  const markAttendanceMutation = {
    mutateAsync: async (data: { lessonId: string; status: string; notes?: string }) => {
      console.warn('markAttendanceMutation - placeholder implementation', data);
    }
  };
  
  const bulkUpdateAttendanceMutation = {
    mutateAsync: async (data: Array<{ lessonId: string; status: string; notes?: string }>) => {
      console.warn('bulkUpdateAttendanceMutation - placeholder implementation', data);
    }
  };

  // Initialize attendance records based on calendar view and selected date
  const initializeAttendanceRecords = useMemo(() => {
    const targetDate = selectedDate || currentDate;
    const relevantLessons = lessons.filter(lesson => {
      const lessonDate = new Date(lesson.date);
      
      switch (calendarView) {
        case 'day':
          return format(lessonDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
        case 'week': {
          // Get lessons for the week containing targetDate
          const weekStart = new Date(targetDate);
          weekStart.setDate(targetDate.getDate() - targetDate.getDay());
          const weekEnd = addDays(weekStart, 6);
          return lessonDate >= weekStart && lessonDate <= weekEnd;
        }
        case 'month':
          return lessonDate.getMonth() === targetDate.getMonth() && 
                 lessonDate.getFullYear() === targetDate.getFullYear();
        case 'year':
          return lessonDate.getFullYear() === targetDate.getFullYear();
        default:
          return false;
      }
    });

    return relevantLessons.map(lesson => {
      const student = students.find(s => s.id === lesson.studentId);
      const lessonDate = new Date(lesson.date);
      const canModify = !isPast(addDays(lessonDate, 7)); // Allow modifications within 7 days
      
      // Type assertion for extended lesson properties that would exist in Supabase
      const extendedLesson = lesson as Lesson & { 
        attendanceStatus?: AttendanceRecord['currentStatus']; 
        attendanceNotes?: string; 
      };
      
      return {
        lessonId: lesson.id,
        studentId: lesson.studentId,
        studentName: student?.name || 'Unknown Student',
        lessonDate: lesson.date,
        lessonTime: lesson.time || '00:00',
        currentStatus: extendedLesson.attendanceStatus || 'pending',
        newStatus: extendedLesson.attendanceStatus || 'pending',
        canModify,
        isModified: false,
        notes: extendedLesson.attendanceNotes || ''
      } as AttendanceRecord;
    });
  }, [lessons, students, selectedDate, currentDate, calendarView]);

  // Initialize records when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAttendanceRecords(initializeAttendanceRecords);
      setValidationErrors([]);
    }
  }, [isOpen, initializeAttendanceRecords]);

  // Validate attendance records against rules
  const validateAttendanceRecords = (records: AttendanceRecord[]): Array<{
    recordId: string;
    rule: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }> => {
    const errors: Array<{
      recordId: string;
      rule: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];

    records.forEach(record => {
      const lessonDate = new Date(record.lessonDate);
      
      // Future date attendance validation
      if (validationRules.find(r => r.id === 'future_attendance')?.isActive) {
        if (lessonDate > new Date() && record.newStatus !== 'pending') {
          errors.push({
            recordId: record.lessonId,
            rule: 'future_attendance',
            message: 'Cannot mark attendance for future lessons',
            severity: 'error'
          });
        }
      }

      // Late marking validation
      if (validationRules.find(r => r.id === 'late_marking')?.isActive) {
        const hoursSinceLesson = (Date.now() - lessonDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLesson > 24 && record.isModified) {
          errors.push({
            recordId: record.lessonId,
            rule: 'late_marking',
            message: 'Marking attendance more than 24 hours after lesson',
            severity: 'warning'
          });
        }
      }

      // Weekend lesson validation
      if (validationRules.find(r => r.id === 'weekend_lessons')?.isActive) {
        const dayOfWeek = lessonDate.getDay();
        if ((dayOfWeek === 0 || dayOfWeek === 6) && record.newStatus === 'present') {
          errors.push({
            recordId: record.lessonId,
            rule: 'weekend_lessons',
            message: 'Weekend lesson attendance confirmed',
            severity: 'info'
          });
        }
      }

      // Consecutive absences validation
      if (validationRules.find(r => r.id === 'consecutive_absences')?.isActive) {
        const studentLessons = lessons
          .filter(l => l.studentId === record.studentId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const currentLessonIndex = studentLessons.findIndex(l => l.id === record.lessonId);
        if (currentLessonIndex >= 2) {
          const recentLessons = studentLessons.slice(currentLessonIndex - 2, currentLessonIndex + 1);
          const allAbsent = recentLessons.every(l => {
            const extendedL = l as Lesson & { attendanceStatus?: AttendanceRecord['currentStatus'] };
            return (extendedL.attendanceStatus === 'absent' || (l.id === record.lessonId && record.newStatus === 'absent'));
          });
          
          if (allAbsent) {
            errors.push({
              recordId: record.lessonId,
              rule: 'consecutive_absences',
              message: 'Student has 3 consecutive absences',
              severity: 'warning'
            });
          }
        }
      }
    });

    return errors;
  };

  // Update attendance status for a record
  const updateAttendanceStatus = (lessonId: string, newStatus: AttendanceRecord['newStatus'], notes?: string) => {
    setAttendanceRecords(prev => prev.map(record => {
      if (record.lessonId === lessonId) {
        const updated = {
          ...record,
          newStatus,
          isModified: newStatus !== record.currentStatus,
          notes: notes !== undefined ? notes : record.notes
        };
        return updated;
      }
      return record;
    }));

    // Re-validate after change
    const updatedRecords = attendanceRecords.map(record => 
      record.lessonId === lessonId 
        ? { ...record, newStatus, isModified: newStatus !== record.currentStatus }
        : record
    );
    setValidationErrors(validateAttendanceRecords(updatedRecords));
  };

  // Bulk update all records to a specific status
  const bulkUpdateStatus = (status: AttendanceRecord['newStatus']) => {
    setAttendanceRecords(prev => prev.map(record => ({
      ...record,
      newStatus: status,
      isModified: status !== record.currentStatus
    })));
  };

  // Reset all changes
  const resetChanges = () => {
    setAttendanceRecords(prev => prev.map(record => ({
      ...record,
      newStatus: record.currentStatus,
      isModified: false
    })));
    setValidationErrors([]);
  };

  // Save attendance changes
  const saveAttendanceChanges = async () => {
    const modifiedRecords = attendanceRecords.filter(record => record.isModified);
    
    if (modifiedRecords.length === 0) {
      onClose();
      return;
    }

    // Check for validation errors
    const errors = validateAttendanceRecords(attendanceRecords);
    const hasErrors = errors.some(error => error.severity === 'error');
    
    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      if (modifiedRecords.length === 1) {
        // Single update
        const record = modifiedRecords[0];
        await markAttendanceMutation.mutateAsync({
          lessonId: record.lessonId,
          status: record.newStatus,
          notes: record.notes
        });
      } else {
        // Bulk update
        await bulkUpdateAttendanceMutation.mutateAsync(
          modifiedRecords.map(record => ({
            lessonId: record.lessonId,
            status: record.newStatus,
            notes: record.notes
          }))
        );
      }

      onClose();
    } catch (error) {
      reportError(error as Error, { 
        category: 'supabase', 
        context: { action: 'saveAttendance', recordCount: modifiedRecords.length } 
      });

      // Queue for offline sync
      modifiedRecords.forEach(record => {
        queueOperation('lessons', 'update', {
          id: record.lessonId,
          attendance_status: record.newStatus,
          attendance_notes: record.notes
        });
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle validation rule
  const toggleValidationRule = (ruleId: string) => {
    setValidationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const getStatusIcon = (status: AttendanceRecord['currentStatus']) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'excused': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AttendanceRecord['currentStatus']) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  if (!isOpen) return null;

  const modifiedCount = attendanceRecords.filter(r => r.isModified).length;
  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Attendance Validation
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {calendarView} view • {format(selectedDate || currentDate, 'MMM dd, yyyy')} • {attendanceRecords.length} lessons
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {modifiedCount > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {modifiedCount} changes
              </span>
            )}
            {(errorCount > 0 || warningCount > 0) && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                errorCount > 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {errorCount > 0 ? `${errorCount} errors` : `${warningCount} warnings`}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'attendance', label: 'Attendance', icon: CheckCircle },
            { id: 'validation', label: 'Validation Rules', icon: AlertTriangle },
            { id: 'bulk', label: 'Bulk Actions', icon: Save }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'attendance' | 'validation' | 'bulk')}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Validation Issues
                  </h4>
                  <div className="space-y-2">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        {getSeverityIcon(error.severity)}
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                          {error.message} ({attendanceRecords.find(r => r.lessonId === error.recordId)?.studentName})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance Records */}
              <div className="space-y-3">
                {attendanceRecords.map(record => {
                  const recordErrors = validationErrors.filter(e => e.recordId === record.lessonId);
                  
                  return (
                    <div 
                      key={record.lessonId}
                      className={`border rounded-lg p-4 ${
                        record.isModified ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 
                        'border-gray-200 dark:border-gray-700'
                      } ${
                        recordErrors.some(e => e.severity === 'error') ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {record.studentName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {format(new Date(record.lessonDate), 'MMM dd, yyyy')} at {record.lessonTime}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Current:</span>
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-md border text-xs ${getStatusColor(record.currentStatus)}`}>
                              {getStatusIcon(record.currentStatus)}
                              <span className="capitalize">{record.currentStatus}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <select
                            value={record.newStatus}
                            onChange={(e) => updateAttendanceStatus(record.lessonId, e.target.value as AttendanceRecord['newStatus'])}
                            disabled={!record.canModify}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                          </select>
                          
                          {record.isModified && (
                            <span className="text-xs text-blue-600 font-medium">Modified</span>
                          )}
                        </div>
                      </div>

                      {recordErrors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {recordErrors.map((error, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              {getSeverityIcon(error.severity)}
                              <span className={`text-xs ${
                                error.severity === 'error' ? 'text-red-600' :
                                error.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                {error.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes field */}
                      <div className="mt-3">
                        <textarea
                          value={record.notes}
                          onChange={(e) => updateAttendanceStatus(record.lessonId, record.newStatus, e.target.value)}
                          placeholder="Add notes about attendance..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm h-16 resize-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Validation Rules
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Configure which validation rules are active for attendance marking.
                </p>

                <div className="space-y-3">
                  {validationRules.map(rule => (
                    <div key={rule.id} className="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            rule.severity === 'error' ? 'bg-red-100 text-red-800' :
                            rule.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rule.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {rule.description}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleValidationRule(rule.id)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          rule.isActive
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Bulk Actions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Apply attendance status to all lessons in the current view.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { status: 'present', label: 'Mark All Present', color: 'bg-green-600 hover:bg-green-700' },
                    { status: 'absent', label: 'Mark All Absent', color: 'bg-red-600 hover:bg-red-700' },
                    { status: 'late', label: 'Mark All Late', color: 'bg-yellow-600 hover:bg-yellow-700' },
                    { status: 'excused', label: 'Mark All Excused', color: 'bg-blue-600 hover:bg-blue-700' },
                    { status: 'pending', label: 'Reset to Pending', color: 'bg-gray-600 hover:bg-gray-700' }
                  ].map(action => (
                    <button
                      key={action.status}
                      onClick={() => bulkUpdateStatus(action.status as AttendanceRecord['newStatus'])}
                      className={`px-3 py-2 text-sm text-white rounded-lg transition-colors ${action.color}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Bulk Action Warning
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Bulk actions will override any individual attendance settings. Make sure this is what you want before saving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={resetChanges}
              disabled={modifiedCount === 0}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Changes</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={saveAttendanceChanges}
              disabled={isLoading || errorCount > 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes ({modifiedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
