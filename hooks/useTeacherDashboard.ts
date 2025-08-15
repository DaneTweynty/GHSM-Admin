// =============================================
// TEACHER DASHBOARD HOOK
// Manages dashboard analytics for teacher mobile app
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { teacherService } from '../services/teacherService';
import { useTeacherAuth } from './useTeacherAuth';
import type { DashboardStats } from '../types/database.types';

export interface UseTeacherDashboardReturn {
  // Dashboard Data
  stats: DashboardStats | null;
  
  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error States
  error: string | null;
  
  // Actions
  fetchDashboardStats: (startDate?: string, endDate?: string) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  
  // Utility Methods
  clearError: () => void;
  getAttendanceRateFormatted: () => string;
  getPerformanceRatingFormatted: () => string;
  getCompletionRateFormatted: () => string;
  getPendingSummariesCount: () => number;
  getThisWeekProgress: () => { completed: number; total: number; percentage: number };
  getNextWeekPreview: () => { upcoming: number; message: string };
}

export function useTeacherDashboard(): UseTeacherDashboardReturn {
  const { profile, isAuthenticated } = useTeacherAuth();
  
  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async (startDate?: string, endDate?: string) => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await teacherService.getDashboardStats(
        profile.id,
        startDate,
        endDate
      );

      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard stats';
      setError(errorMessage);
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Refresh dashboard
  const refreshDashboard = useCallback(async () => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsRefreshing(true);
      await fetchDashboardStats();
    } catch (err) {
      console.error('Failed to refresh dashboard:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, profile?.id, fetchDashboardStats]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get formatted attendance rate
  const getAttendanceRateFormatted = useCallback((): string => {
    if (!stats?.attendance_rate) return 'N/A';
    return `${Math.round(stats.attendance_rate)}%`;
  }, [stats?.attendance_rate]);

  // Get formatted performance rating
  const getPerformanceRatingFormatted = useCallback((): string => {
    if (!stats?.average_performance) return 'N/A';
    return `${stats.average_performance.toFixed(1)}/5`;
  }, [stats?.average_performance]);

  // Get formatted completion rate
  const getCompletionRateFormatted = useCallback((): string => {
    if (!stats || !stats.total_lessons || stats.total_lessons === 0) return 'N/A';
    const rate = (Number(stats.completed_lessons) / Number(stats.total_lessons)) * 100;
    return `${Math.round(rate)}%`;
  }, [stats]);

  // Get pending summaries count
  const getPendingSummariesCount = useCallback((): number => {
    return Number(stats?.session_summaries_pending || 0);
  }, [stats?.session_summaries_pending]);

  // Get this week's progress
  const getThisWeekProgress = useCallback(() => {
    const thisWeekLessons = Number(stats?.this_week_lessons || 0);
    const completedLessons = Number(stats?.completed_lessons || 0);
    
    // Estimate completed lessons for this week (approximate)
    const totalLessons = Number(stats?.total_lessons || 0);
    const completedThisWeek = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * thisWeekLessons)
      : 0;
    
    const percentage = thisWeekLessons > 0 
      ? Math.round((completedThisWeek / thisWeekLessons) * 100)
      : 0;

    return {
      completed: completedThisWeek,
      total: thisWeekLessons,
      percentage
    };
  }, [stats]);

  // Get next week preview
  const getNextWeekPreview = useCallback(() => {
    const nextWeekLessons = Number(stats?.next_week_lessons || 0);
    
    let message = '';
    if (nextWeekLessons === 0) {
      message = 'No lessons scheduled';
    } else if (nextWeekLessons === 1) {
      message = '1 lesson scheduled';
    } else if (nextWeekLessons <= 5) {
      message = `${nextWeekLessons} lessons scheduled`;
    } else if (nextWeekLessons <= 10) {
      message = `${nextWeekLessons} lessons - busy week ahead`;
    } else {
      message = `${nextWeekLessons} lessons - very busy week!`;
    }

    return {
      upcoming: nextWeekLessons,
      message
    };
  }, [stats?.next_week_lessons]);

  // Initial data fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      fetchDashboardStats();
    }
  }, [isAuthenticated, profile?.id, fetchDashboardStats]);

  // Auto-refresh dashboard every 15 minutes
  useEffect(() => {
    if (!isAuthenticated || !profile?.id) return;

    const interval = setInterval(() => {
      refreshDashboard();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, profile?.id, refreshDashboard]);

  return {
    // Dashboard Data
    stats,
    
    // Loading States
    isLoading,
    isRefreshing,
    
    // Error States
    error,
    
    // Actions
    fetchDashboardStats,
    refreshDashboard,
    
    // Utility Methods
    clearError,
    getAttendanceRateFormatted,
    getPerformanceRatingFormatted,
    getCompletionRateFormatted,
    getPendingSummariesCount,
    getThisWeekProgress,
    getNextWeekPreview
  };
}
