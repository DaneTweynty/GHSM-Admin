// =============================================
// TEACHER STUDENTS MANAGEMENT HOOK
// Manages student information for teacher mobile app
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { teacherService } from '../services/teacherService';
import { useTeacherAuth } from './useTeacherAuth';
import type { 
  InstructorStudent, 
  StudentDetails, 
  StudentAttendance 
} from '../types/database.types';

export interface UseTeacherStudentsReturn {
  // Students Data
  students: InstructorStudent[];
  selectedStudent: StudentDetails | null;
  studentAttendance: StudentAttendance[];
  
  // Loading States
  isLoading: boolean;
  isLoadingDetails: boolean;
  isLoadingAttendance: boolean;
  
  // Error States
  error: string | null;
  
  // Actions
  fetchStudents: () => Promise<void>;
  fetchStudentDetails: (studentId: string) => Promise<void>;
  fetchStudentAttendance: (studentId: string, startDate?: string, endDate?: string) => Promise<void>;
  clearSelectedStudent: () => void;
  refreshStudents: () => Promise<void>;
  
  // Utility Methods
  clearError: () => void;
  getStudentById: (studentId: string) => InstructorStudent | undefined;
  getStudentsByInstrument: (instrument: string) => InstructorStudent[];
  getActiveStudents: () => InstructorStudent[];
  getStudentsWithRecentLessons: (days?: number) => InstructorStudent[];
  searchStudents: (query: string) => InstructorStudent[];
  getStudentAttendanceRate: (studentId: string) => number | null;
}

export function useTeacherStudents(): UseTeacherStudentsReturn {
  const { profile, isAuthenticated } = useTeacherAuth();
  
  // State
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await teacherService.getInstructorStudents(profile.id);
      setStudents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students';
      setError(errorMessage);
      console.error('Failed to fetch students:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Fetch student details
  const fetchStudentDetails = useCallback(async (studentId: string) => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsLoadingDetails(true);
      setError(null);

      const data = await teacherService.getStudentDetails(studentId, profile.id);
      setSelectedStudent(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch student details';
      setError(errorMessage);
      console.error('Failed to fetch student details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Fetch student attendance
  const fetchStudentAttendance = useCallback(async (
    studentId: string,
    startDate?: string,
    endDate?: string
  ) => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsLoadingAttendance(true);
      setError(null);

      const data = await teacherService.getStudentAttendance(
        studentId,
        profile.id,
        startDate,
        endDate
      );
      setStudentAttendance(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch student attendance';
      setError(errorMessage);
      console.error('Failed to fetch student attendance:', err);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Clear selected student
  const clearSelectedStudent = useCallback(() => {
    setSelectedStudent(null);
    setStudentAttendance([]);
  }, []);

  // Refresh students
  const refreshStudents = useCallback(async () => {
    await fetchStudents();
  }, [fetchStudents]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get student by ID
  const getStudentById = useCallback((studentId: string): InstructorStudent | undefined => {
    return students.find(student => student.student_id === studentId);
  }, [students]);

  // Get students by instrument
  const getStudentsByInstrument = useCallback((instrument: string): InstructorStudent[] => {
    return students.filter(student => 
      student.instrument.toLowerCase().includes(instrument.toLowerCase())
    );
  }, [students]);

  // Get active students
  const getActiveStudents = useCallback((): InstructorStudent[] => {
    return students.filter(student => student.status === 'active');
  }, [students]);

  // Get students with recent lessons
  const getStudentsWithRecentLessons = useCallback((days = 7): InstructorStudent[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    return students.filter(student => 
      student.last_lesson_date && student.last_lesson_date >= cutoffDateString
    );
  }, [students]);

  // Search students
  const searchStudents = useCallback((query: string): InstructorStudent[] => {
    if (!query.trim()) return students;

    const searchTerm = query.toLowerCase();
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm) ||
      (student.nickname && student.nickname.toLowerCase().includes(searchTerm)) ||
      student.instrument.toLowerCase().includes(searchTerm) ||
      (student.email && student.email.toLowerCase().includes(searchTerm))
    );
  }, [students]);

  // Get student attendance rate
  const getStudentAttendanceRate = useCallback((studentId: string): number | null => {
    const student = getStudentById(studentId);
    if (!student || !student.total_lessons || student.total_lessons === 0) {
      return null;
    }

    // Calculate attendance rate based on completed lessons
    return (Number(student.completed_lessons) / Number(student.total_lessons)) * 100;
  }, [getStudentById]);

  // Initial data fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      fetchStudents();
    }
  }, [isAuthenticated, profile?.id, fetchStudents]);

  // Auto-refresh students every 10 minutes
  useEffect(() => {
    if (!isAuthenticated || !profile?.id) return;

    const interval = setInterval(() => {
      fetchStudents();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, profile?.id, fetchStudents]);

  return {
    // Students Data
    students,
    selectedStudent,
    studentAttendance,
    
    // Loading States
    isLoading,
    isLoadingDetails,
    isLoadingAttendance,
    
    // Error States
    error,
    
    // Actions
    fetchStudents,
    fetchStudentDetails,
    fetchStudentAttendance,
    clearSelectedStudent,
    refreshStudents,
    
    // Utility Methods
    clearError,
    getStudentById,
    getStudentsByInstrument,
    getActiveStudents,
    getStudentsWithRecentLessons,
    searchStudents,
    getStudentAttendanceRate
  };
}
