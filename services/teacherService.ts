// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Teacher-specific service class
export class TeacherService {
  private static instance: TeacherService;
  
  static getInstance(): TeacherService {
    if (!TeacherService.instance) {
      TeacherService.instance = new TeacherService();
    }
    return TeacherService.instance;
  }

  // =============================================
  // AUTHENTICATION METHODS
  // =============================================

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Update last login timestamp
    if (data.user) {
      await this.updateLastLogin(data.user.id);
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async getInstructorProfile(instructorId: string) {
    const { data, error } = await supabase.rpc('get_instructor_profile', {
      instructor_uuid: instructorId
    });

    if (error) throw error;
    return data?.[0] || null;
  }

  private async updateLastLogin(instructorId: string) {
    await supabase.rpc('update_instructor_last_login', {
      instructor_uuid: instructorId
    });
  }

  // =============================================
  // SCHEDULE MANAGEMENT METHODS
  // =============================================

  async getInstructorLessons(
    instructorId: string,
    startDate?: string,
    endDate?: string
  ) {
    const { data, error } = await supabase.rpc('get_instructor_lessons', {
      instructor_uuid: instructorId,
      start_date: startDate,
      end_date: endDate
    });

    if (error) throw error;
    return data || [];
  }

  async getTodaysLessons(instructorId: string) {
    const { data, error } = await supabase.rpc('get_todays_lessons', {
      instructor_uuid: instructorId
    });

    if (error) throw error;
    return data || [];
  }

  async updateLessonStatus(
    lessonId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
    instructorId: string
  ) {
    const { data, error } = await supabase.rpc('update_lesson_status', {
      lesson_uuid: lessonId,
      new_status: status,
      instructor_uuid: instructorId
    });

    if (error) throw error;
    return data;
  }

  async getLessonQuickSummary(lessonId: string, instructorId: string) {
    const { data, error } = await supabase.rpc('get_lesson_quick_summary', {
      lesson_uuid: lessonId,
      instructor_uuid: instructorId
    });

    if (error) throw error;
    return data?.[0] || null;
  }

  // =============================================
  // STUDENT MANAGEMENT METHODS
  // =============================================

  async getInstructorStudents(instructorId: string) {
    const { data, error } = await supabase.rpc('get_instructor_students', {
      instructor_uuid: instructorId
    });

    if (error) throw error;
    return data || [];
  }

  async getStudentDetails(studentId: string, instructorId: string) {
    const { data, error } = await supabase.rpc('get_student_details', {
      student_uuid: studentId,
      instructor_uuid: instructorId
    });

    if (error) throw error;
    return data?.[0] || null;
  }

  async getStudentAttendance(
    studentId: string,
    instructorId: string,
    startDate?: string,
    endDate?: string
  ) {
    const { data, error } = await supabase.rpc('get_student_attendance', {
      student_uuid: studentId,
      instructor_uuid: instructorId,
      start_date: startDate,
      end_date: endDate
    });

    if (error) throw error;
    return data || [];
  }

  // =============================================
  // SESSION SUMMARY METHODS
  // =============================================

  async createSessionSummary(params: {
    lessonId: string;
    instructorId: string;
    summaryText: string;
    topicsCovered: string[];
    homeworkAssigned?: string;
    studentProgress?: string;
    nextLessonFocus?: string;
    achievements?: string;
    studentPerformanceRating?: number;
    lessonDifficultyRating?: number;
    techniqueFocus?: string[];
    repertoireCovered?: string[];
    areasForImprovement?: string[];
    strengthsDemonstrated?: string[];
    practiceAssignments?: any;
    materialsUsed?: string[];
    recommendedPracticeTime?: number;
  }) {
    const { data, error } = await supabase.rpc('create_session_summary', {
      lesson_uuid: params.lessonId,
      instructor_uuid: params.instructorId,
      summary_text: params.summaryText,
      topics_covered: params.topicsCovered,
      homework_assigned: params.homeworkAssigned,
      student_progress: params.studentProgress,
      next_lesson_focus: params.nextLessonFocus,
      achievements: params.achievements,
      student_performance_rating: params.studentPerformanceRating,
      lesson_difficulty_rating: params.lessonDifficultyRating,
      technique_focus: params.techniqueFocus || [],
      repertoire_covered: params.repertoireCovered || [],
      areas_for_improvement: params.areasForImprovement || [],
      strengths_demonstrated: params.strengthsDemonstrated || [],
      practice_assignments: params.practiceAssignments || {},
      materials_used: params.materialsUsed || [],
      recommended_practice_time: params.recommendedPracticeTime
    });

    if (error) throw error;
    return data;
  }

  async getSessionSummary(lessonId: string, instructorId: string) {
    const { data, error } = await supabase.rpc('get_session_summary', {
      lesson_uuid: lessonId,
      instructor_uuid: instructorId
    });

    if (error) throw error;
    return data?.[0] || null;
  }

  // =============================================
  // ATTENDANCE METHODS
  // =============================================

  async markAttendance(params: {
    lessonId: string;
    studentId: string;
    instructorId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    arrivalTime?: string;
    departureTime?: string;
    notes?: string;
  }) {
    const { data, error } = await supabase.rpc('mark_attendance', {
      lesson_uuid: params.lessonId,
      student_uuid: params.studentId,
      instructor_uuid: params.instructorId,
      attendance_status: params.status,
      arrival_time: params.arrivalTime,
      departure_time: params.departureTime,
      notes: params.notes
    });

    if (error) throw error;
    return data;
  }

  // =============================================
  // DASHBOARD ANALYTICS METHODS
  // =============================================

  async getDashboardStats(
    instructorId: string,
    startDate?: string,
    endDate?: string
  ) {
    const { data, error } = await supabase.rpc('get_instructor_dashboard_stats', {
      instructor_uuid: instructorId,
      date_range_start: startDate,
      date_range_end: endDate
    });

    if (error) throw error;
    return data?.[0] || null;
  }

  // =============================================
  // CHAT METHODS
  // =============================================

  async getInstructorConversations(instructorId: string) {
    const { data, error } = await supabase.rpc('get_instructor_conversations', {
      instructor_uuid: instructorId
    });

    if (error) throw error;
    return data || [];
  }

  async getChatMessages(conversationId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        type,
        file_url,
        file_name,
        sender_id,
        sender_type,
        is_edited,
        is_deleted,
        created_at,
        updated_at,
        sender:user_profiles!sender_id(full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    type?: 'text' | 'file' | 'image' | 'audio';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        sender_type: 'instructor',
        content: params.content,
        type: params.type || 'text',
        file_url: params.fileUrl,
        file_name: params.fileName,
        file_size: params.fileSize,
        file_type: params.fileType
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last message
    await supabase
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: params.content.substring(0, 100)
      })
      .eq('id', params.conversationId);

    return data;
  }

  async markMessagesAsRead(conversationId: string, instructorId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        read_by: supabase.rpc('array_append', {
          array: 'read_by',
          element: instructorId
        })
      })
      .eq('conversation_id', conversationId)
      .not('sender_id', 'eq', instructorId);

    if (error) throw error;
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async getSystemSettings() {
    const { data, error } = await supabase.rpc('get_teacher_system_settings');
    if (error) throw error;
    
    // Convert to key-value object
    const settings: Record<string, any> = {};
    data?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });
    
    return settings;
  }

  async logActivity(params: {
    instructorId: string;
    action: string;
    tableName: string;
    recordId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    await supabase.rpc('log_teacher_activity', {
      instructor_uuid: params.instructorId,
      action_name: params.action,
      table_affected: params.tableName,
      record_id: params.recordId,
      old_values: params.oldValues,
      new_values: params.newValues
    });
  }

  // =============================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================

  subscribeToLessons(instructorId: string, callback: (payload: any) => void) {
    return supabase
      .channel('lessons')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `instructor_id=eq.${instructorId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToChatMessages(conversationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToAttendance(instructorId: string, callback: (payload: any) => void) {
    return supabase
      .channel('attendance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `instructor_id=eq.${instructorId}`
        },
        callback
      )
      .subscribe();
  }

  // =============================================
  // FILE UPLOAD METHODS
  // =============================================

  async uploadChatFile(file: File, conversationId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `chat/${conversationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async deleteFile(filePath: string) {
    const { error } = await supabase.storage
      .from('chat-files')
      .remove([filePath]);

    if (error) throw error;
  }
}

export const teacherService = TeacherService.getInstance();
