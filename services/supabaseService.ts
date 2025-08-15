// @ts-nocheck
import { getSupabaseClient, isSupabaseConfigured } from '../utils/supabaseClient';
import type { Database } from '../utils/database.types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { 
  toUiStudent, 
  toUiInstructor,
  mapStudentsToUi,
  mapInstructorsToUi,
  mapBillingsToUi
} from '../utils/mappers';
import type { Payment } from '../types';

type Tables = Database['public']['Tables'];
type RealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

// Utility to get client or throw meaningful error
const getClient = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }
  return getSupabaseClient();
};

// Student Services
export const studentService = {
  async getAll() {
    const { data, error } = await getClient()
      .from('students')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return mapStudentsToUi(data || []);
  },

  async getById(id: string) {
    const { data, error } = await getClient()
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return toUiStudent(data);
  },

  async create(student: Tables['students']['Insert']) {
    const { data, error } = await getClient()
      .from('students')
      .insert(student)
      .select()
      .single();
    
    if (error) throw error;
    return toUiStudent(data);
  },

  async update(id: string, updates: Tables['students']['Update']) {
    const { data, error } = await getClient()
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return toUiStudent(data);
  },

  async delete(id: string) {
    const { error } = await getClient()
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async bulkCreate(students: Tables['students']['Insert'][]) {
    const { data, error } = await getClient()
      .from('students')
      .insert(students)
      .select();
    
    if (error) throw error;
    return mapStudentsToUi(data || []);
  },

  async search(query: string) {
    const { data, error } = await getClient()
      .from('students')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,guardian_name.ilike.%${query}%`)
      .order('name');
    
    if (error) throw error;
    return mapStudentsToUi(data || []);
  }
};

// Instructor Services
export const instructorService = {
  async getAll() {
    const { data, error } = await getClient()
      .from('instructors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return mapInstructorsToUi(data || []);
  },

  async getById(id: string) {
    const { data, error } = await getClient()
      .from('instructors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return toUiInstructor(data);
  },

  async create(instructor: Tables['instructors']['Insert']) {
    const { data, error } = await getClient()
      .from('instructors')
      .insert(instructor)
      .select()
      .single();
    
    if (error) throw error;
    return toUiInstructor(data);
  },

  async update(id: string, updates: Tables['instructors']['Update']) {
    const { data, error } = await getClient()
      .from('instructors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return toUiInstructor(data);
  },

  async delete(id: string) {
    const { error } = await getClient()
      .from('instructors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Lesson Services
export const lessonService = {
  async getAll() {
    const { data, error } = await getClient()
      .from('lessons')
      .select(`
        *,
        instructors(id, name),
        students(id, name)
      `)
      .order('start_time');
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await getClient()
      .from('lessons')
      .select(`
        *,
        instructors(id, name, email),
        students(id, name, email)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await getClient()
      .from('lessons')
      .select(`
        *,
        instructors(id, name),
        students(id, name)
      `)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time');
    
    if (error) throw error;
    return data;
  },

  async getByInstructor(instructorId: string) {
    const { data, error } = await getClient()
      .from('lessons')
      .select(`
        *,
        students(id, name)
      `)
      .eq('instructor_id', instructorId)
      .order('start_time');
    
    if (error) throw error;
    return data;
  },

  async getByStudent(studentId: string) {
    const { data, error } = await getClient()
      .from('lessons')
      .select(`
        *,
        instructors(id, name)
      `)
      .eq('student_id', studentId)
      .order('start_time');
    
    if (error) throw error;
    return data;
  },

  async create(lesson: Tables['lessons']['Insert']) {
    const { data, error } = await getClient()
      .from('lessons')
      .insert(lesson)
      .select(`
        *,
        instructors(id, name),
        students(id, name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['lessons']['Update']) {
    const { data, error } = await getClient()
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        instructors(id, name),
        students(id, name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await getClient()
      .from('lessons')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Billing Services
export const billingService = {
  async getAll() {
    const { data, error } = await getClient()
      .from('billings')
      .select(`
        *,
        students(id, name, guardian_name)
      `)
      .order('due_date');
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await getClient()
      .from('billings')
      .select(`
        *,
        students(id, name, guardian_name, guardian_email)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByStudent(studentId: string) {
    const { data, error } = await getClient()
      .from('billings')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date');
    
    if (error) throw error;
    return mapBillingsToUi(data || []);
  },

  async getOverdue() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await getClient()
      .from('billings')
      .select(`
        *,
        students(id, name, guardian_name)
      `)
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date');
    
    if (error) throw error;
    return data;
  },

  async create(billing: Tables['billings']['Insert']) {
    const { data, error } = await getClient()
      .from('billings')
      .insert(billing)
      .select(`
        *,
        students(id, name, guardian_name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['billings']['Update']) {
    const { data, error } = await getClient()
      .from('billings')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        students(id, name, guardian_name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await getClient()
      .from('billings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Payment Services
export const paymentService = {
  async getAll() {
    const { data, error } = await getClient()
      .from('payments')
      .select(`
        *,
        billings(id, student_id, amount, students(id, name))
      `)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await getClient()
      .from('payments')
      .select(`
        *,
        billings(id, student_id, amount, students(id, name))
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByBilling(billingId: string) {
    const { data, error } = await getClient()
      .from('payments')
      .select('*')
      .eq('billing_id', billingId)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data as Payment[];
  },

  async create(payment: Tables['payments']['Insert']) {
    const { data, error } = await getClient()
      .from('payments')
      .insert(payment)
      .select(`
        *,
        billings(id, student_id, amount, students(id, name))
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['payments']['Update']) {
    const { data, error } = await getClient()
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        billings(id, student_id, amount, students(id, name))
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await getClient()
      .from('payments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Attendance Services
export const attendanceService = {
  async getByLesson(lessonId: string) {
    const { data, error } = await getClient()
      .from('attendance_records')
      .select(`
        *,
        students(id, name)
      `)
      .eq('lesson_id', lessonId)
      .order('marked_at');
    
    if (error) throw error;
    return data;
  },

  async getByStudent(studentId: string, startDate?: string, endDate?: string) {
    let query = getClient()
      .from('attendance_records')
      .select(`
        *,
        lessons(id, title, start_time, instructors(id, name))
      `)
      .eq('student_id', studentId);

    if (startDate) {
      query = query.gte('marked_at', startDate);
    }
    if (endDate) {
      query = query.lte('marked_at', endDate);
    }

    const { data, error } = await query.order('marked_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(attendance: Tables['attendance_records']['Insert']) {
    // Business Rule: Check if session summary exists for this lesson before allowing attendance
    const existingSummary = await getClient()
      .from('session_summaries')
      .select('id')
      .eq('lesson_id', attendance.lesson_id)
      .maybeSingle();

    if (existingSummary.error) throw existingSummary.error;
    
    if (!existingSummary.data) {
      throw new Error(
        'Cannot mark attendance: A session summary must be created for this lesson before marking student attendance. ' +
        'Please complete the session summary first to document what was covered in the lesson.'
      );
    }

    const { data, error } = await getClient()
      .from('attendance_records')
      .insert(attendance)
      .select(`
        *,
        students(id, name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async bulkCreate(attendanceRecords: Tables['attendance_records']['Insert'][]) {
    // Business Rule: Check if session summary exists for all lessons before allowing bulk attendance
    const lessonIds = [...new Set(attendanceRecords.map(record => record.lesson_id))];
    
    for (const lessonId of lessonIds) {
      const existingSummary = await getClient()
        .from('session_summaries')
        .select('id')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existingSummary.error) throw existingSummary.error;
      
      if (!existingSummary.data) {
        throw new Error(
          `Cannot mark attendance: A session summary must be created for lesson ${lessonId} before marking student attendance. ` +
          'Please complete the session summary first to document what was covered in the lesson.'
        );
      }
    }

    const { data, error } = await getClient()
      .from('attendance_records')
      .insert(attendanceRecords)
      .select(`
        *,
        students(id, name)
      `);
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['attendance_records']['Update']) {
    const { data, error } = await getClient()
      .from('attendance_records')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        students(id, name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await getClient()
      .from('attendance_records')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Session Summary Services
export const sessionSummaryService = {
  async getAll() {
    const { data, error } = await getClient()
      .from('session_summaries')
      .select(`
        *,
        lessons(id, title, start_time, students(id, name)),
        instructors(id, name)
      `)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByLesson(lessonId: string) {
    const { data, error } = await getClient()
      .from('session_summaries')
      .select(`
        *,
        lessons(id, title, start_time, students(id, name)),
        instructors(id, name)
      `)
      .eq('lesson_id', lessonId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  },

  async getByInstructor(instructorId: string, limit = 10) {
    const { data, error } = await getClient()
      .from('session_summaries')
      .select(`
        *,
        lessons(id, title, start_time, students(id, name))
      `)
      .eq('instructor_id', instructorId)
      .order('submitted_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getByStudent(studentId: string, limit = 10) {
    const { data, error } = await getClient()
      .from('session_summaries')
      .select(`
        *,
        lessons!inner(id, title, start_time, student_id),
        instructors(id, name)
      `)
      .eq('lessons.student_id', studentId)
      .order('submitted_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async create(summary: Tables['session_summaries']['Insert']) {
    const { data, error } = await getClient()
      .from('session_summaries')
      .insert(summary)
      .select(`
        *,
        lessons(id, title, start_time, students(id, name)),
        instructors(id, name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['session_summaries']['Update']) {
    const { data, error } = await getClient()
      .from('session_summaries')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        lessons(id, title, start_time, students(id, name)),
        instructors(id, name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await getClient()
      .from('session_summaries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Real-time subscriptions
export const realtimeService = {
  subscribeToStudents(callback: (payload: RealtimePayload) => void) {
    return getClient()
      .channel('students_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        callback
      )
      .subscribe();
  },

  subscribeToLessons(callback: (payload: RealtimePayload) => void) {
    return getClient()
      .channel('lessons_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lessons' }, 
        callback
      )
      .subscribe();
  },

  subscribeToInstructors(callback: (payload: RealtimePayload) => void) {
    return getClient()
      .channel('instructors_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'instructors' }, 
        callback
      )
      .subscribe();
  },

  subscribeToSessionSummaries(callback: (payload: RealtimePayload) => void) {
    return getClient()
      .channel('session_summaries_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'session_summaries' }, 
        callback
      )
      .subscribe();
  },

  subscribeToBillings(callback: (payload: RealtimePayload) => void) {
    return getClient()
      .channel('billings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'billings' }, 
        callback
      )
      .subscribe();
  },

  subscribeToAttendance(callback: (payload: RealtimePayload) => void) {
    return getClient()
      .channel('attendance_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance_records' }, 
        callback
      )
      .subscribe();
  },

  unsubscribe(subscription: RealtimeChannel) {
    return getClient().removeChannel(subscription);
  }
};

// Dashboard and Analytics Services
export const analyticsService = {
  async getDashboardStats() {
    // Use the SQL RPC function for optimized dashboard stats
    const { data, error } = await getClient()
      .rpc('get_dashboard_stats');

    if (error) throw error;
    
    return {
      totalStudents: data?.total_students || 0,
      totalInstructors: data?.total_instructors || 0,
      lessonsThisWeek: data?.lessons_this_week || 0,
      pendingBillings: data?.pending_billings || 0
    };
  },

  async getRevenueData(startDate: string, endDate: string) {
    const { data, error } = await getClient()
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'completed')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date');

    if (error) throw error;
    return data;
  },

  async getAttendanceStats(startDate: string, endDate: string) {
    // Use the SQL RPC function for optimized attendance report
    const { data, error } = await getClient()
      .rpc('generate_attendance_report', {
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) throw error;
    return data;
  },

  async calculateStudentBilling(studentId: string, startDate: string, endDate: string) {
    // Use the SQL RPC function for student billing calculation
    const { data, error } = await getClient()
      .rpc('calculate_student_billing', {
        p_student_id: studentId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) throw error;
    return data;
  },

  async getInstructorAvailability(instructorId: string, checkDate: string) {
    // Use the SQL RPC function for instructor availability check
    const { data, error } = await getClient()
      .rpc('get_instructor_availability', {
        p_instructor_id: instructorId,
        p_date: checkDate
      });

    if (error) throw error;
    return data;
  },

  async checkLessonConflicts(instructorId: string, studentId: string, startTime: string, endTime: string, excludeLessonId?: string) {
    // Use the SQL RPC function for lesson conflict checking
    const { data, error } = await getClient()
      .rpc('check_lesson_conflicts', {
        p_instructor_id: instructorId,
        p_student_id: studentId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_lesson_id: excludeLessonId
      });

    if (error) throw error;
    return data;
  }
};

// Chat Services
export const chatService = {
  // Conversation management
  async getConversations(userId: string) {
    const { data, error } = await getClient()
      .from('chat_conversations')
      .select(`
        *,
        chat_messages!chat_conversations_last_message_id_fkey(
          id, content, created_at, sender_id, type
        )
      `)
      .contains('participants', [userId])
      .eq('status', 'active')
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createConversation(conversation: Tables['chat_conversations']['Insert']) {
    const { data, error } = await getClient()
      .from('chat_conversations')
      .insert(conversation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConversation(id: string, updates: Tables['chat_conversations']['Update']) {
    const { data, error } = await getClient()
      .from('chat_conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Message management
  async getMessages(conversationId: string, limit = 50, before?: string) {
    let query = getClient()
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Return in ascending order for display
    return data.reverse();
  },

  async sendMessage(message: Tables['chat_messages']['Insert']) {
    const { data, error } = await getClient()
      .from('chat_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;

    // Update conversation's last message
    await getClient()
      .from('chat_conversations')
      .update({
        last_message_id: data.id,
        last_message_at: data.created_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', message.conversation_id);

    return data;
  },

  async editMessage(id: string, content: string) {
    const { data, error } = await getClient()
      .from('chat_messages')
      .update({
        content,
        edited_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMessage(id: string) {
    const { data, error } = await getClient()
      .from('chat_messages')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markMessagesAsRead(conversationId: string, userId: string) {
    const { error } = await getClient()
      .from('chat_messages')
      .update({
        read_by: getClient().rpc('array_append', { 
          array_col: 'read_by', 
          new_value: userId 
        })
      })
      .eq('conversation_id', conversationId)
      .not('read_by', 'cs', `{${userId}}`);

    if (error) throw error;
  },

  // Real-time subscriptions
  subscribeToConversation(conversationId: string, onMessage: (message: RealtimePayload) => void) {
    return getClient()
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        onMessage
      )
      .subscribe();
  },

  subscribeToConversations(userId: string, onUpdate: (payload: RealtimePayload) => void) {
    return getClient()
      .channel(`user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: `participants=cs.{${userId}}`
        },
        onUpdate
      )
      .subscribe();
  },

  unsubscribe(subscription: RealtimeChannel) {
    return getClient().removeChannel(subscription);
  }
};
