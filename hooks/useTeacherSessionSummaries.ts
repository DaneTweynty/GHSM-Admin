// =============================================
// TEACHER SESSION SUMMARIES HOOK
// Manages session summaries for teacher mobile app
// =============================================

import { useState, useCallback } from 'react';
import { teacherService } from '../services/teacherService';
import { useTeacherAuth } from './useTeacherAuth';
import type { 
  SessionSummaryData, 
  SessionSummaryForm,
  PracticeAssignment 
} from '../types/database.types';

export interface UseTeacherSessionSummariesReturn {
  // Session Summary Data
  currentSummary: SessionSummaryData | null;
  
  // Loading States
  isLoading: boolean;
  isCreating: boolean;
  
  // Error States
  error: string | null;
  
  // Actions
  createSessionSummary: (lessonId: string, formData: SessionSummaryForm) => Promise<{ success: boolean; error: string | null }>;
  getSessionSummary: (lessonId: string) => Promise<SessionSummaryData | null>;
  
  // Form Helpers
  validateSummaryForm: (formData: SessionSummaryForm) => { isValid: boolean; errors: string[] };
  createPracticeAssignment: (assignment: Omit<PracticeAssignment, 'completed'>) => PracticeAssignment;
  
  // Utility Methods
  clearError: () => void;
  clearCurrentSummary: () => void;
}

export function useTeacherSessionSummaries(): UseTeacherSessionSummariesReturn {
  const { profile, isAuthenticated } = useTeacherAuth();
  
  // State
  const [currentSummary, setCurrentSummary] = useState<SessionSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create session summary
  const createSessionSummary = useCallback(async (
    lessonId: string, 
    formData: SessionSummaryForm
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!isAuthenticated || !profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate form data
    const validation = validateSummaryForm(formData);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    try {
      setIsCreating(true);
      setError(null);

      // Convert practice assignments to the expected format
      const practiceAssignments = formData.practiceAssignments.reduce((acc, assignment) => {
        acc[assignment.title] = {
          description: assignment.description,
          duration: assignment.duration,
          difficulty: assignment.difficulty,
          priority: assignment.priority,
          dueDate: assignment.dueDate,
          completed: false
        };
        return acc;
      }, {} as Record<string, unknown>);

      const summaryId = await teacherService.createSessionSummary({
        lessonId,
        instructorId: profile.id,
        summaryText: formData.summaryText,
        topicsCovered: formData.topicsCovered,
        homeworkAssigned: formData.homeworkAssigned,
        studentProgress: formData.studentProgress,
        nextLessonFocus: formData.nextLessonFocus,
        achievements: formData.achievements,
        studentPerformanceRating: formData.studentPerformanceRating,
        lessonDifficultyRating: formData.lessonDifficultyRating,
        techniqueFocus: formData.techniqueFocus,
        repertoireCovered: formData.repertoireCovered,
        areasForImprovement: formData.areasForImprovement,
        strengthsDemonstrated: formData.strengthsDemonstrated,
        practiceAssignments,
        materialsUsed: formData.materialsUsed,
        recommendedPracticeTime: formData.recommendedPracticeTime
      });

      // Log the activity
      await teacherService.logActivity({
        instructorId: profile.id,
        action: 'create_session_summary',
        tableName: 'session_summaries',
        recordId: summaryId,
        newValues: { lessonId, summaryCreated: true }
      });

      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session summary';
      setError(errorMessage);
      console.error('Failed to create session summary:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Get session summary
  const getSessionSummary = useCallback(async (
    lessonId: string
  ): Promise<SessionSummaryData | null> => {
    if (!isAuthenticated || !profile?.id) return null;

    try {
      setIsLoading(true);
      setError(null);

      const data = await teacherService.getSessionSummary(lessonId, profile.id);
      setCurrentSummary(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session summary';
      setError(errorMessage);
      console.error('Failed to fetch session summary:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Validate summary form
  const validateSummaryForm = useCallback((formData: SessionSummaryForm): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required fields
    if (!formData.summaryText?.trim()) {
      errors.push('Summary text is required');
    }

    if (!formData.topicsCovered || formData.topicsCovered.length === 0) {
      errors.push('At least one topic covered is required');
    }

    // Validate ratings
    if (formData.studentPerformanceRating !== undefined) {
      if (formData.studentPerformanceRating < 1 || formData.studentPerformanceRating > 5) {
        errors.push('Student performance rating must be between 1 and 5');
      }
    }

    if (formData.lessonDifficultyRating !== undefined) {
      if (formData.lessonDifficultyRating < 1 || formData.lessonDifficultyRating > 5) {
        errors.push('Lesson difficulty rating must be between 1 and 5');
      }
    }

    // Validate practice time
    if (formData.recommendedPracticeTime !== undefined) {
      if (formData.recommendedPracticeTime < 0) {
        errors.push('Recommended practice time cannot be negative');
      }
    }

    // Validate practice assignments
    if (formData.practiceAssignments) {
      formData.practiceAssignments.forEach((assignment, index) => {
        if (!assignment.title?.trim()) {
          errors.push(`Practice assignment ${index + 1} requires a title`);
        }
        if (!assignment.description?.trim()) {
          errors.push(`Practice assignment ${index + 1} requires a description`);
        }
        if (assignment.duration !== undefined && assignment.duration < 0) {
          errors.push(`Practice assignment ${index + 1} duration cannot be negative`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Create practice assignment helper
  const createPracticeAssignment = useCallback((
    assignment: Omit<PracticeAssignment, 'completed'>
  ): PracticeAssignment => {
    return {
      ...assignment,
      completed: false
    };
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current summary
  const clearCurrentSummary = useCallback(() => {
    setCurrentSummary(null);
  }, []);

  return {
    // Session Summary Data
    currentSummary,
    
    // Loading States
    isLoading,
    isCreating,
    
    // Error States
    error,
    
    // Actions
    createSessionSummary,
    getSessionSummary,
    
    // Form Helpers
    validateSummaryForm,
    createPracticeAssignment,
    
    // Utility Methods
    clearError,
    clearCurrentSummary
  };
}
