// =============================================
// TEACHER SCHEDULE MANAGEMENT HOOK
// Manages lesson scheduling for teacher mobile app
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { teacherService } from '../services/teacherService';
import { useTeacherAuth } from './useTeacherAuth';
import type { 
  InstructorLesson, 
  TodaysLesson, 
  LessonQuickSummary,
  LessonStatus,
  ApiResponse 
} from '../types/database.types';

export interface UseTeacherScheduleReturn {
  // Lessons Data
  lessons: InstructorLesson[];
  todaysLessons: TodaysLesson[];
  nextLesson: TodaysLesson | null;
  
  // Loading States
  isLoading: boolean;
  isLoadingToday: boolean;
  isUpdating: boolean;
  
  // Error States
  error: string | null;
  
  // Actions
  fetchLessons: (startDate?: string, endDate?: string) => Promise<void>;
  fetchTodaysLessons: () => Promise<void>;
  updateLessonStatus: (lessonId: string, status: LessonStatus) => Promise<{ error: string | null }>;
  getLessonQuickSummary: (lessonId: string) => Promise<LessonQuickSummary | null>;
  refreshSchedule: () => Promise<void>;
  
  // Utility Methods
  clearError: () => void;
  getLessonById: (lessonId: string) => InstructorLesson | undefined;
  getLessonsForDate: (date: string) => InstructorLesson[];
  getUpcomingLessons: (limit?: number) => InstructorLesson[];
  getPastLessons: (limit?: number) => InstructorLesson[];
}

export function useTeacherSchedule(): UseTeacherScheduleReturn {
  const { profile, isAuthenticated } = useTeacherAuth();
  
  // State
  const [lessons, setLessons] = useState<InstructorLesson[]>([]);
  const [todaysLessons, setTodaysLessons] = useState<TodaysLesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingToday, setIsLoadingToday] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch lessons for date range
  const fetchLessons = useCallback(async (startDate?: string, endDate?: string) => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await teacherService.getInstructorLessons(
        profile.id,
        startDate,
        endDate
      );

      setLessons(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lessons';
      setError(errorMessage);
      console.error('Failed to fetch lessons:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Fetch today's lessons
  const fetchTodaysLessons = useCallback(async () => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsLoadingToday(true);
      setError(null);

      const data = await teacherService.getTodaysLessons(profile.id);
      setTodaysLessons(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today\'s lessons';
      setError(errorMessage);
      console.error('Failed to fetch today\'s lessons:', err);
    } finally {
      setIsLoadingToday(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Update lesson status
  const updateLessonStatus = useCallback(async (
    lessonId: string, 
    status: LessonStatus
  ): Promise<{ error: string | null }> => {
    if (!isAuthenticated || !profile?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      setIsUpdating(true);
      setError(null);

      await teacherService.updateLessonStatus(lessonId, status, profile.id);

      // Update local state
      setLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.lesson_id === lessonId
            ? { ...lesson, status }
            : lesson
        )
      );

      setTodaysLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.lesson_id === lessonId
            ? { ...lesson, status }
            : lesson
        )
      );

      // Log the activity
      await teacherService.logActivity({
        instructorId: profile.id,
        action: 'update_lesson_status',
        tableName: 'lessons',
        recordId: lessonId,
        newValues: { status }
      });

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lesson status';
      setError(errorMessage);
      console.error('Failed to update lesson status:', err);
      return { error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Get lesson quick summary
  const getLessonQuickSummary = useCallback(async (
    lessonId: string
  ): Promise<LessonQuickSummary | null> => {
    if (!isAuthenticated || !profile?.id) return null;

    try {
      const data = await teacherService.getLessonQuickSummary(lessonId, profile.id);
      return data;
    } catch (err) {
      console.error('Failed to get lesson quick summary:', err);
      return null;
    }
  }, [isAuthenticated, profile?.id]);

  // Refresh entire schedule
  const refreshSchedule = useCallback(async () => {
    await Promise.all([
      fetchLessons(),
      fetchTodaysLessons()
    ]);
  }, [fetchLessons, fetchTodaysLessons]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get lesson by ID
  const getLessonById = useCallback((lessonId: string): InstructorLesson | undefined => {
    return lessons.find(lesson => lesson.lesson_id === lessonId);
  }, [lessons]);

  // Get lessons for specific date
  const getLessonsForDate = useCallback((date: string): InstructorLesson[] => {
    return lessons.filter(lesson => lesson.date === date);
  }, [lessons]);

  // Get upcoming lessons
  const getUpcomingLessons = useCallback((limit = 10): InstructorLesson[] => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

    return lessons
      .filter(lesson => {
        if (lesson.date > today) return true;
        if (lesson.date === today && lesson.time >= currentTime) return true;
        return false;
      })
      .filter(lesson => lesson.status === 'scheduled')
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.time.localeCompare(b.time);
      })
      .slice(0, limit);
  }, [lessons]);

  // Get past lessons
  const getPastLessons = useCallback((limit = 10): InstructorLesson[] => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

    return lessons
      .filter(lesson => {
        if (lesson.date < today) return true;
        if (lesson.date === today && lesson.time < currentTime) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.time.localeCompare(a.time);
      })
      .slice(0, limit);
  }, [lessons]);

  // Calculate next lesson
  const nextLesson = todaysLessons.find(lesson => lesson.is_next_lesson) || null;

  // Initial data fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      refreshSchedule();
    }
  }, [isAuthenticated, profile?.id, refreshSchedule]);

  // Auto-refresh today's lessons every 5 minutes
  useEffect(() => {
    if (!isAuthenticated || !profile?.id) return;

    const interval = setInterval(() => {
      fetchTodaysLessons();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, profile?.id, fetchTodaysLessons]);

  return {
    // Lessons Data
    lessons,
    todaysLessons,
    nextLesson,
    
    // Loading States
    isLoading,
    isLoadingToday,
    isUpdating,
    
    // Error States
    error,
    
    // Actions
    fetchLessons,
    fetchTodaysLessons,
    updateLessonStatus,
    getLessonQuickSummary,
    refreshSchedule,
    
    // Utility Methods
    clearError,
    getLessonById,
    getLessonsForDate,
    getUpcomingLessons,
    getPastLessons
  };
}
