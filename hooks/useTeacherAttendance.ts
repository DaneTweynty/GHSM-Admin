// =============================================
// TEACHER ATTENDANCE HOOK
// Manages attendance tracking for teacher mobile app
// =============================================

import { useState, useCallback } from 'react';
import { teacherService } from '../services/teacherService';
import { useTeacherAuth } from './useTeacherAuth';
import type { AttendanceStatus, AttendanceForm } from '../types/database.types';

export interface UseTeacherAttendanceReturn {
  // Loading States
  isMarking: boolean;
  
  // Error States
  error: string | null;
  
  // Actions
  markAttendance: (params: {
    lessonId: string;
    studentId: string;
    attendanceData: AttendanceForm;
  }) => Promise<{ success: boolean; error: string | null }>;
  
  // Form Helpers
  validateAttendanceForm: (formData: AttendanceForm) => { isValid: boolean; errors: string[] };
  createAttendanceForm: (status: AttendanceStatus, options?: {
    arrivalTime?: string;
    departureTime?: string;
    notes?: string;
  }) => AttendanceForm;
  
  // Utility Methods
  clearError: () => void;
  formatTimeForAttendance: (date: Date) => string;
  calculateLessonDuration: (arrivalTime?: string, departureTime?: string) => number | null;
}

export function useTeacherAttendance(): UseTeacherAttendanceReturn {
  const { profile, isAuthenticated } = useTeacherAuth();
  
  // State
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mark attendance
  const markAttendance = useCallback(async (params: {
    lessonId: string;
    studentId: string;
    attendanceData: AttendanceForm;
  }): Promise<{ success: boolean; error: string | null }> => {
    if (!isAuthenticated || !profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate form data
    const validation = validateAttendanceForm(params.attendanceData);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    try {
      setIsMarking(true);
      setError(null);

      const attendanceId = await teacherService.markAttendance({
        lessonId: params.lessonId,
        studentId: params.studentId,
        instructorId: profile.id,
        status: params.attendanceData.status,
        arrivalTime: params.attendanceData.arrivalTime,
        departureTime: params.attendanceData.departureTime,
        notes: params.attendanceData.notes
      });

      // Log the activity
      await teacherService.logActivity({
        instructorId: profile.id,
        action: 'mark_attendance',
        tableName: 'attendance_records',
        recordId: attendanceId,
        newValues: {
          lessonId: params.lessonId,
          studentId: params.studentId,
          status: params.attendanceData.status
        }
      });

      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark attendance';
      setError(errorMessage);
      console.error('Failed to mark attendance:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsMarking(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Validate attendance form
  const validateAttendanceForm = useCallback((formData: AttendanceForm): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required fields
    if (!formData.status) {
      errors.push('Attendance status is required');
    }

    // Validate status values
    const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
    if (formData.status && !validStatuses.includes(formData.status)) {
      errors.push('Invalid attendance status');
    }

    // Validate times
    if (formData.arrivalTime && formData.departureTime) {
      const arrival = new Date(`1970-01-01T${formData.arrivalTime}`);
      const departure = new Date(`1970-01-01T${formData.departureTime}`);
      
      if (departure <= arrival) {
        errors.push('Departure time must be after arrival time');
      }
    }

    // If status is present, arrival time should be provided
    if (formData.status === 'present' && !formData.arrivalTime) {
      errors.push('Arrival time is required when marking as present');
    }

    // If status is late, arrival time is required
    if (formData.status === 'late' && !formData.arrivalTime) {
      errors.push('Arrival time is required when marking as late');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (formData.arrivalTime && !timeRegex.test(formData.arrivalTime)) {
      errors.push('Invalid arrival time format (use HH:MM)');
    }

    if (formData.departureTime && !timeRegex.test(formData.departureTime)) {
      errors.push('Invalid departure time format (use HH:MM)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Create attendance form helper
  const createAttendanceForm = useCallback((
    status: AttendanceStatus,
    options: {
      arrivalTime?: string;
      departureTime?: string;
      notes?: string;
    } = {}
  ): AttendanceForm => {
    const now = new Date();
    const currentTime = formatTimeForAttendance(now);

    return {
      status,
      arrivalTime: options.arrivalTime || (status === 'present' || status === 'late' ? currentTime : undefined),
      departureTime: options.departureTime,
      notes: options.notes
    };
  }, []);

  // Format time for attendance
  const formatTimeForAttendance = useCallback((date: Date): string => {
    return date.toTimeString().split(' ')[0].slice(0, 5); // HH:MM format
  }, []);

  // Calculate lesson duration
  const calculateLessonDuration = useCallback((
    arrivalTime?: string, 
    departureTime?: string
  ): number | null => {
    if (!arrivalTime || !departureTime) return null;

    try {
      const arrival = new Date(`1970-01-01T${arrivalTime}`);
      const departure = new Date(`1970-01-01T${departureTime}`);
      
      const durationMs = departure.getTime() - arrival.getTime();
      return Math.round(durationMs / (1000 * 60)); // Convert to minutes
    } catch {
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Loading States
    isMarking,
    
    // Error States
    error,
    
    // Actions
    markAttendance,
    
    // Form Helpers
    validateAttendanceForm,
    createAttendanceForm,
    
    // Utility Methods
    clearError,
    formatTimeForAttendance,
    calculateLessonDuration
  };
}
