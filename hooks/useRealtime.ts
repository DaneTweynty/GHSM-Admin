import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService, chatService } from '../services/supabaseService';
import { queryKeys } from './useSupabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  table: string;
}

export const useRealtimeStudents = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const handleStudentChanges = (payload: RealtimePayload) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      
      if (payload.new?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.student(payload.new.id as string) 
        });
      }
      if (payload.old?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.student(payload.old.id as string) 
        });
      }
    };

    channelRef.current = realtimeService.subscribeToStudents(handleStudentChanges);

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [queryClient]);
};

export const useRealtimeLessons = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const handleLessonChanges = (payload: RealtimePayload) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      
      if (payload.new?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lesson(payload.new.id as string) 
        });
      }
      if (payload.old?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lesson(payload.old.id as string) 
        });
      }

      // Invalidate instructor and student specific lesson queries
      if (payload.new?.instructor_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lessonsByInstructor(payload.new.instructor_id as string) 
        });
      }
      if (payload.new?.student_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lessonsByStudent(payload.new.student_id as string) 
        });
      }
      if (payload.old?.instructor_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lessonsByInstructor(payload.old.instructor_id as string) 
        });
      }
      if (payload.old?.student_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lessonsByStudent(payload.old.student_id as string) 
        });
      }
    };

    channelRef.current = realtimeService.subscribeToLessons(handleLessonChanges);

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [queryClient]);
};

export const useRealtimeInstructors = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const handleInstructorChanges = (payload: RealtimePayload) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.instructors });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      
      if (payload.new?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.instructor(payload.new.id as string) 
        });
      }
      if (payload.old?.id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.instructor(payload.old.id as string) 
        });
      }
    };

    channelRef.current = realtimeService.subscribeToInstructors(handleInstructorChanges);

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [queryClient]);
};

export const useRealtimeSessionSummaries = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const handleSessionSummaryChanges = (payload: RealtimePayload) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionSummaries });
      
      if (payload.new?.lesson_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.sessionSummaryByLesson(payload.new.lesson_id as string) 
        });
      }
      if (payload.new?.instructor_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.sessionSummariesByInstructor(payload.new.instructor_id as string) 
        });
      }
      if (payload.old?.lesson_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.sessionSummaryByLesson(payload.old.lesson_id as string) 
        });
      }
      if (payload.old?.instructor_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.sessionSummariesByInstructor(payload.old.instructor_id as string) 
        });
      }
    };

    channelRef.current = realtimeService.subscribeToSessionSummaries(handleSessionSummaryChanges);

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [queryClient]);
};

// Chat realtime hooks
export const useRealtimeChatConversations = (userId: string) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const handleConversationChanges = (payload: RealtimePayload) => {
      // Invalidate conversations queries
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      
      if (payload.new?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'messages', payload.new.id as string] 
        });
      }
    };

    channelRef.current = chatService.subscribeToConversations(userId, handleConversationChanges);

    return () => {
      if (channelRef.current) {
        chatService.unsubscribe(channelRef.current);
      }
    };
  }, [queryClient, userId]);
};

export const useRealtimeChatMessages = (conversationId: string) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const handleMessageChanges = (_payload: RealtimePayload) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({ 
        queryKey: ['chat', 'messages', conversationId] 
      });
      // Also invalidate conversations to update last message info
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    };

    channelRef.current = chatService.subscribeToConversation(conversationId, handleMessageChanges);

    return () => {
      if (channelRef.current) {
        chatService.unsubscribe(channelRef.current);
      }
    };
  }, [queryClient, conversationId]);
};

// Master hook to enable all realtime subscriptions
export const useRealtimeSubscriptions = () => {
  useRealtimeStudents();
  useRealtimeLessons();
  useRealtimeInstructors();
  useRealtimeSessionSummaries();
  useRealtimeBillings();
  useRealtimeAttendance();
};

// Billing real-time updates
export const useRealtimeBillings = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const handleBillingChanges = (payload: RealtimePayload) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.billings });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      
      if (payload.new?.student_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.billingsByStudent(payload.new.student_id as string) 
        });
      }
      if (payload.old?.student_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.billingsByStudent(payload.old.student_id as string) 
        });
      }
    };

    channelRef.current = realtimeService.subscribeToBillings(handleBillingChanges);

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [queryClient]);
};

// Attendance real-time updates
export const useRealtimeAttendance = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const handleAttendanceChanges = (payload: RealtimePayload) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
      
      if (payload.new?.lesson_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.attendanceByLesson(payload.new.lesson_id as string) 
        });
      }
      if (payload.new?.student_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.attendanceByStudent(payload.new.student_id as string) 
        });
      }
      if (payload.old?.lesson_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.attendanceByLesson(payload.old.lesson_id as string) 
        });
      }
      if (payload.old?.student_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.attendanceByStudent(payload.old.student_id as string) 
        });
      }
    };

    channelRef.current = realtimeService.subscribeToAttendance(handleAttendanceChanges);

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(channelRef.current);
      }
    };
  }, [queryClient]);
};
