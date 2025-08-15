/**
 * Mappers to convert between database types and domain types
 * This ensures type safety and consistency across the application
 */

import { Database } from './database.types';
import { Student, Instructor, Lesson, Billing, Payment, AttendanceRecord, SessionSummary } from '../types';

// Database types for convenience
type DbStudent = Database['public']['Tables']['students']['Row'];
type DbInstructor = Database['public']['Tables']['instructors']['Row'];
type DbLesson = Database['public']['Tables']['lessons']['Row'];
type DbBilling = Database['public']['Tables']['billings']['Row'];
type DbPayment = Database['public']['Tables']['payments']['Row'];
type DbAttendance = Database['public']['Tables']['attendance_records']['Row'];
type DbSessionSummary = Database['public']['Tables']['session_summaries']['Row'];

// Insert types
export type DbStudentInsert = Database['public']['Tables']['students']['Insert'];
export type DbInstructorInsert = Database['public']['Tables']['instructors']['Insert'];
export type DbLessonInsert = Database['public']['Tables']['lessons']['Insert'];
export type DbBillingInsert = Database['public']['Tables']['billings']['Insert'];
export type DbPaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type DbAttendanceInsert = Database['public']['Tables']['attendance_records']['Insert'];
export type DbSessionSummaryInsert = Database['public']['Tables']['session_summaries']['Insert'];

/**
 * Student mappers - aligned with actual database schema
 */
export const toUiStudent = (dbStudent: DbStudent): Student => ({
  id: dbStudent.id,
  studentIdNumber: dbStudent.id, // Using ID as student number for now
  name: dbStudent.name,
  nickname: '',
  birthdate: dbStudent.date_of_birth || undefined,
  instrument: '', // Will be derived from lessons
  sessionsAttended: 0, // Will be computed from attendance
  sessionsBilled: 0, // Will be computed from billings
  creditBalance: 0,
  email: dbStudent.email || undefined,
  contactNumber: dbStudent.phone || undefined,
  address: {
    country: 'Philippines',
    province: '',
    city: '',
    barangay: '',
    addressLine1: '',
    addressLine2: ''
  },
  guardianName: dbStudent.guardian_name || undefined,
  guardianFullName: dbStudent.guardian_name || undefined,
  guardianPhone: dbStudent.guardian_phone || undefined,
  guardianEmail: dbStudent.guardian_email || undefined,
  gender: undefined, // Not in current schema
  status: dbStudent.status === 'active' ? 'active' : 'inactive',
  profilePictureUrl: undefined
});

export const toDbStudentInsert = (student: Partial<Student>): DbStudentInsert => ({
  name: student.name || '',
  email: student.email,
  phone: student.contactNumber,
  date_of_birth: student.birthdate,
  guardian_name: student.guardianName || student.guardianFullName,
  guardian_email: student.guardianEmail,
  guardian_phone: student.guardianPhone,
  status: student.status || 'active'
});

/**
 * Instructor mappers - aligned with actual database schema
 */
export const toUiInstructor = (dbInstructor: DbInstructor): Instructor => ({
  id: dbInstructor.id,
  name: dbInstructor.name,
  email: dbInstructor.email || '',
  phone: dbInstructor.phone || '',
  specialty: dbInstructor.specialties || [],
  color: '#3B82F6', // Default blue color
  profilePictureUrl: '',
  status: dbInstructor.is_active ? 'active' : 'inactive',
  bio: dbInstructor.bio || ''
});

export const toDbInstructorInsert = (instructor: Partial<Instructor>): DbInstructorInsert => ({
  name: instructor.name || '',
  email: instructor.email,
  phone: instructor.phone,
  specialties: instructor.specialty,
  bio: instructor.bio,
  is_active: instructor.status === 'active'
});

/**
 * Lesson mappers - handles the date/time conversion
 */
export const toUiLesson = (dbLesson: DbLesson): Lesson => {
  const startDate = new Date(dbLesson.start_time);
  const endDate = new Date(dbLesson.end_time);
  
  return {
    id: dbLesson.id,
    studentId: dbLesson.student_id,
    instructorId: dbLesson.instructor_id,
    roomId: 1, // Default room ID
    date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
    time: startDate.toTimeString().slice(0, 5), // HH:MM format
    endTime: endDate.toTimeString().slice(0, 5), // HH:MM format
    notes: dbLesson.notes || '',
    status: dbLesson.status === 'cancelled' || dbLesson.status === 'rescheduled' ? 'cancelled' : 'scheduled'
  };
};

export const toDbLessonInsert = (lesson: Partial<Lesson>): DbLessonInsert => {
  // Convert date + time to ISO datetime strings
  const startDateTime = lesson.date && lesson.time 
    ? new Date(`${lesson.date}T${lesson.time}:00`).toISOString()
    : new Date().toISOString();
  
  const endDateTime = lesson.date && lesson.endTime
    ? new Date(`${lesson.date}T${lesson.endTime}:00`).toISOString()
    : new Date(new Date(startDateTime).getTime() + 60 * 60000).toISOString(); // Default 1 hour

  return {
    student_id: lesson.studentId || '',
    instructor_id: lesson.instructorId || '',
    title: 'Music Lesson', // Default title
    start_time: startDateTime,
    end_time: endDateTime,
    status: lesson.status === 'cancelled' ? 'cancelled' : 'scheduled',
    lesson_type: 'private', // Default lesson type
    notes: lesson.notes
  };
};

/**
 * Billing mappers
 */
export const toUiBilling = (dbBilling: DbBilling, studentName = ''): Billing => ({
  id: dbBilling.id,
  studentId: dbBilling.student_id,
  studentName,
  amount: dbBilling.amount,
  status: dbBilling.status === 'paid' ? 'paid' : 'unpaid',
  sessionsCovered: 1, // Default, should be computed
  dateIssued: dbBilling.created_at.split('T')[0], // Extract date part
  items: [],
  payments: [],
  paidAmount: dbBilling.status === 'paid' ? dbBilling.amount : 0
});

export const toDbBillingInsert = (billing: Partial<Billing>): DbBillingInsert => ({
  student_id: billing.studentId || '',
  amount: billing.amount || 0,
  billing_period_start: billing.dateIssued || new Date().toISOString().split('T')[0],
  billing_period_end: billing.dateIssued || new Date().toISOString().split('T')[0],
  due_date: billing.dateIssued || new Date().toISOString().split('T')[0],
  status: billing.status === 'paid' ? 'paid' : 'pending',
  description: 'Music lesson payment'
});

/**
 * Payment mappers
 */
export const toUiPayment = (dbPayment: DbPayment): Payment => ({
  id: dbPayment.id,
  billingId: dbPayment.billing_id,
  studentId: '', // Will need to be resolved from billing
  amount: dbPayment.amount,
  method: (dbPayment.payment_method.charAt(0).toUpperCase() + dbPayment.payment_method.slice(1)) as Payment['method'],
  reference: dbPayment.transaction_id || '',
  note: dbPayment.notes || '',
  date: dbPayment.payment_date
});

export const toDbPaymentInsert = (payment: Partial<Payment>): DbPaymentInsert => ({
  billing_id: payment.billingId || '',
  amount: payment.amount || 0,
  payment_method: payment.method?.toLowerCase() || 'cash',
  payment_date: payment.date || new Date().toISOString(),
  transaction_id: payment.reference,
  notes: payment.note,
  status: 'completed'
});

/**
 * Attendance mappers
 */
export const toUiAttendance = (dbAttendance: DbAttendance): AttendanceRecord => ({
  id: dbAttendance.id,
  lessonId: dbAttendance.lesson_id,
  studentId: dbAttendance.student_id,
  status: dbAttendance.status,
  markedAt: dbAttendance.marked_at,
  markedBy: dbAttendance.marked_by,
  notes: dbAttendance.notes || '',
  createdAt: dbAttendance.created_at,
  updatedAt: dbAttendance.updated_at
});

export const toDbAttendanceInsert = (attendance: Partial<AttendanceRecord>): DbAttendanceInsert => ({
  lesson_id: attendance.lessonId || '',
  student_id: attendance.studentId || '',
  status: attendance.status || 'present',
  marked_at: attendance.markedAt || new Date().toISOString(),
  marked_by: attendance.markedBy || '',
  notes: attendance.notes
});

/**
 * Session Summary mappers - aligned with actual database schema
 */
export const toUiSessionSummary = (dbSummary: DbSessionSummary): SessionSummary => ({
  id: dbSummary.id,
  lessonId: dbSummary.lesson_id,
  studentId: '', // Will need to be resolved from lesson
  instructorId: dbSummary.instructor_id,
  summary: dbSummary.summary_text,
  objectives: dbSummary.topics_covered || [],
  achievements: [], // Not in current schema
  homework: dbSummary.homework_assigned ? [dbSummary.homework_assigned] : [],
  nextLessonPlan: dbSummary.next_lesson_focus || '',
  studentProgress: dbSummary.student_progress ? JSON.parse(dbSummary.student_progress) : {},
  rating: 0, // Not in current schema
  createdAt: dbSummary.created_at,
  updatedAt: dbSummary.updated_at
});

export const toDbSessionSummaryInsert = (summary: Partial<SessionSummary>): DbSessionSummaryInsert => ({
  lesson_id: summary.lessonId || '',
  instructor_id: summary.instructorId || '',
  summary_text: summary.summary || '',
  topics_covered: summary.objectives,
  homework_assigned: summary.homework?.join(', ') || null,
  student_progress: summary.studentProgress ? JSON.stringify(summary.studentProgress) : null,
  next_lesson_focus: summary.nextLessonPlan,
  submitted_at: new Date().toISOString()
});

/**
 * Utility functions for common transformations
 */

// Convert array of DB rows to UI objects
export const mapStudentsToUi = (dbStudents: DbStudent[]): Student[] => 
  dbStudents.map(toUiStudent);

export const mapInstructorsToUi = (dbInstructors: DbInstructor[]): Instructor[] => 
  dbInstructors.map(toUiInstructor);

export const mapLessonsToUi = (dbLessons: DbLesson[]): Lesson[] => 
  dbLessons.map(toUiLesson);

export const mapBillingsToUi = (dbBillings: DbBilling[], studentNames: Record<string, string> = {}): Billing[] => 
  dbBillings.map(billing => toUiBilling(billing, studentNames[billing.student_id] || ''));

export const mapPaymentsToUi = (dbPayments: DbPayment[]): Payment[] => 
  dbPayments.map(toUiPayment);

export const mapAttendanceToUi = (dbAttendance: DbAttendance[]): AttendanceRecord[] => 
  dbAttendance.map(toUiAttendance);

export const mapSessionSummariesToUi = (dbSummaries: DbSessionSummary[]): SessionSummary[] => 
  dbSummaries.map(toUiSessionSummary);

// Helper to compute if attendance was marked recently for a student
export const wasAttendedRecently = (attendance: AttendanceRecord[], studentId: string, withinHours = 24): boolean => {
  const recentAttendance = attendance.filter(record => 
    record.studentId === studentId && 
    new Date(record.markedAt).getTime() > Date.now() - (withinHours * 60 * 60 * 1000)
  );
  return recentAttendance.length > 0;
};

// Helper to get the latest attendance for a student
export const getLatestAttendance = (attendance: AttendanceRecord[], studentId: string): AttendanceRecord | null => {
  const studentAttendance = attendance
    .filter(record => record.studentId === studentId)
    .sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime());
  
  return studentAttendance[0] || null;
};
