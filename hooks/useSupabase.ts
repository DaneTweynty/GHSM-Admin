import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService, instructorService, lessonService, billingService, paymentService, attendanceService, sessionSummaryService, analyticsService, chatService } from '../services/supabaseService';
import type { Database } from '../utils/database.types';

type Tables = Database['public']['Tables'];

// Query Keys
export const queryKeys = {
  students: ['students'] as const,
  student: (id: string) => ['students', id] as const,
  instructors: ['instructors'] as const,
  instructor: (id: string) => ['instructors', id] as const,
  lessons: ['lessons'] as const,
  lesson: (id: string) => ['lessons', id] as const,
  lessonsByInstructor: (instructorId: string) => ['lessons', 'instructor', instructorId] as const,
  lessonsByStudent: (studentId: string) => ['lessons', 'student', studentId] as const,
  lessonsByDateRange: (start: string, end: string) => ['lessons', 'dateRange', start, end] as const,
  billings: ['billings'] as const,
  billing: (id: string) => ['billings', id] as const,
  billingsByStudent: (studentId: string) => ['billings', 'student', studentId] as const,
  overdueBillings: ['billings', 'overdue'] as const,
  payments: ['payments'] as const,
  payment: (id: string) => ['payments', id] as const,
  paymentsByBilling: (billingId: string) => ['payments', 'billing', billingId] as const,
  attendance: ['attendance'] as const,
  attendanceByLesson: (lessonId: string) => ['attendance', 'lesson', lessonId] as const,
  attendanceByStudent: (studentId: string, startDate?: string, endDate?: string) => 
    ['attendance', 'student', studentId, startDate, endDate] as const,
  sessionSummaries: ['sessionSummaries'] as const,
  sessionSummaryByLesson: (lessonId: string) => ['sessionSummaries', 'lesson', lessonId] as const,
  sessionSummariesByInstructor: (instructorId: string) => ['sessionSummaries', 'instructor', instructorId] as const,
  sessionSummariesByStudent: (studentId: string) => ['sessionSummaries', 'student', studentId] as const,
  dashboardStats: ['dashboard', 'stats'] as const,
  revenueData: (start: string, end: string) => ['analytics', 'revenue', start, end] as const,
  attendanceStats: (start: string, end: string) => ['analytics', 'attendance', start, end] as const,
  chatConversations: (userId?: string) => ['chat', 'conversations', userId] as const,
  chatMessages: (conversationId: string, limit?: number, before?: string) => 
    ['chat', 'messages', conversationId, limit, before] as const,
};

// Student Hooks
export const useStudents = () => {
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: studentService.getAll,
  });
};

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: queryKeys.student(id),
    queryFn: () => studentService.getById(id),
    enabled: !!id,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: studentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Tables['students']['Update'] }) =>
      studentService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.student(data.id) });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: studentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

export const useBulkCreateStudents = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: studentService.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

export const useSearchStudents = (query: string) => {
  return useQuery({
    queryKey: ['students', 'search', query],
    queryFn: () => studentService.search(query),
    enabled: query.length > 0,
  });
};

// Instructor Hooks
export const useInstructors = () => {
  return useQuery({
    queryKey: queryKeys.instructors,
    queryFn: instructorService.getAll,
  });
};

export const useInstructor = (id: string) => {
  return useQuery({
    queryKey: queryKeys.instructor(id),
    queryFn: () => instructorService.getById(id),
    enabled: !!id,
  });
};

export const useCreateInstructor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: instructorService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instructors });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

export const useUpdateInstructor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Tables['instructors']['Update'] }) =>
      instructorService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instructors });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor(data.id) });
    },
  });
};

export const useDeleteInstructor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: instructorService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instructors });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

// Lesson Hooks
export const useLessons = () => {
  return useQuery({
    queryKey: queryKeys.lessons,
    queryFn: lessonService.getAll,
  });
};

export const useLesson = (id: string) => {
  return useQuery({
    queryKey: queryKeys.lesson(id),
    queryFn: () => lessonService.getById(id),
    enabled: !!id,
  });
};

export const useLessonsByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: queryKeys.lessonsByDateRange(startDate, endDate),
    queryFn: () => lessonService.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useLessonsByInstructor = (instructorId: string) => {
  return useQuery({
    queryKey: queryKeys.lessonsByInstructor(instructorId),
    queryFn: () => lessonService.getByInstructor(instructorId),
    enabled: !!instructorId,
  });
};

export const useLessonsByStudent = (studentId: string) => {
  return useQuery({
    queryKey: queryKeys.lessonsByStudent(studentId),
    queryFn: () => lessonService.getByStudent(studentId),
    enabled: !!studentId,
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: lessonService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Tables['lessons']['Update'] }) =>
      lessonService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons });
      queryClient.invalidateQueries({ queryKey: queryKeys.lesson(data.id) });
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: lessonService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

// Billing Hooks
export const useBillings = () => {
  return useQuery({
    queryKey: queryKeys.billings,
    queryFn: billingService.getAll,
  });
};

export const useBilling = (id: string) => {
  return useQuery({
    queryKey: queryKeys.billing(id),
    queryFn: () => billingService.getById(id),
    enabled: !!id,
  });
};

export const useBillingsByStudent = (studentId: string) => {
  return useQuery({
    queryKey: queryKeys.billingsByStudent(studentId),
    queryFn: () => billingService.getByStudent(studentId),
    enabled: !!studentId,
  });
};

export const useOverdueBillings = () => {
  return useQuery({
    queryKey: queryKeys.overdueBillings,
    queryFn: billingService.getOverdue,
  });
};

export const useCreateBilling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: billingService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billings });
      queryClient.invalidateQueries({ queryKey: queryKeys.overdueBillings });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

export const useUpdateBilling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Tables['billings']['Update'] }) =>
      billingService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billings });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.overdueBillings });
    },
  });
};

export const useDeleteBilling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: billingService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billings });
      queryClient.invalidateQueries({ queryKey: queryKeys.overdueBillings });
    },
  });
};

// Payment Hooks
export const usePayments = () => {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: paymentService.getAll,
  });
};

export const usePayment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.payment(id),
    queryFn: () => paymentService.getById(id),
    enabled: !!id,
  });
};

export const usePaymentsByBilling = (billingId: string) => {
  return useQuery({
    queryKey: queryKeys.paymentsByBilling(billingId),
    queryFn: () => paymentService.getByBilling(billingId),
    enabled: !!billingId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paymentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.billings });
      queryClient.invalidateQueries({ queryKey: queryKeys.overdueBillings });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Tables['payments']['Update'] }) =>
      paymentService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.payment(data.id) });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paymentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.billings });
    },
  });
};

// Attendance Hooks
export const useAttendanceByLesson = (lessonId: string) => {
  return useQuery({
    queryKey: queryKeys.attendanceByLesson(lessonId),
    queryFn: () => attendanceService.getByLesson(lessonId),
    enabled: !!lessonId,
  });
};

export const useAttendanceByStudent = (studentId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: queryKeys.attendanceByStudent(studentId, startDate, endDate),
    queryFn: () => attendanceService.getByStudent(studentId, startDate, endDate),
    enabled: !!studentId,
  });
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceByLesson(data.lesson_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceByStudent(data.student_id) });
    },
  });
};

export const useBulkCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceService.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Tables['attendance_records']['Update'] }) =>
      attendanceService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceByLesson(data.lesson_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceByStudent(data.student_id) });
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
    },
  });
};

// Session Summary Hooks
export const useSessionSummaries = () => {
  return useQuery({
    queryKey: queryKeys.sessionSummaries,
    queryFn: () => sessionSummaryService.getAll(),
  });
};

export const useSessionSummaryByLesson = (lessonId: string) => {
  return useQuery({
    queryKey: queryKeys.sessionSummaryByLesson(lessonId),
    queryFn: () => sessionSummaryService.getByLesson(lessonId),
    enabled: !!lessonId,
  });
};

export const useSessionSummariesByInstructor = (instructorId: string, limit = 10) => {
  return useQuery({
    queryKey: queryKeys.sessionSummariesByInstructor(instructorId),
    queryFn: () => sessionSummaryService.getByInstructor(instructorId, limit),
    enabled: !!instructorId,
  });
};

export const useSessionSummariesByStudent = (studentId: string, limit = 10) => {
  return useQuery({
    queryKey: queryKeys.sessionSummariesByStudent(studentId),
    queryFn: () => sessionSummaryService.getByStudent(studentId, limit),
    enabled: !!studentId,
  });
};

export const useCreateSessionSummary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sessionSummaryService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionSummaryByLesson(data.lesson_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionSummariesByInstructor(data.instructor_id) });
    },
  });
};

export const useUpdateSessionSummary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Tables['session_summaries']['Update'] }) =>
      sessionSummaryService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionSummaryByLesson(data.lesson_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionSummariesByInstructor(data.instructor_id) });
    },
  });
};

export const useDeleteSessionSummary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sessionSummaryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionSummaries });
    },
  });
};

// Analytics Hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: analyticsService.getDashboardStats,
  });
};

export const useRevenueData = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: queryKeys.revenueData(startDate, endDate),
    queryFn: () => analyticsService.getRevenueData(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useAttendanceStats = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: queryKeys.attendanceStats(startDate, endDate),
    queryFn: () => analyticsService.getAttendanceStats(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

// Chat Hooks
export const useChatConversations = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.chatConversations(userId),
    queryFn: () => chatService.getConversations(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
  });
};

export const useChatMessages = (conversationId: string, limit = 50, before?: string) => {
  return useQuery({
    queryKey: queryKeys.chatMessages(conversationId, limit, before),
    queryFn: () => chatService.getMessages(conversationId, limit, before),
    enabled: !!conversationId,
    staleTime: 1000, // Very short stale time for real-time chat
  });
};

export const useCreateChatConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatService.createConversation,
    onSuccess: () => {
      // Invalidate conversations queries
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatService.sendMessage,
    onSuccess: (data: Tables['chat_messages']['Row']) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({ 
        queryKey: ['chat', 'messages', data.conversation_id] 
      });
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useEditChatMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => 
      chatService.editMessage(id, content),
    onSuccess: (data: Tables['chat_messages']['Row']) => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat', 'messages', data.conversation_id] 
      });
    },
  });
};

export const useDeleteChatMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatService.deleteMessage,
    onSuccess: (data: Tables['chat_messages']['Row']) => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat', 'messages', data.conversation_id] 
      });
    },
  });
};

export const useMarkMessagesAsRead = () => {
  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      chatService.markMessagesAsRead(conversationId, userId),
  });
};
