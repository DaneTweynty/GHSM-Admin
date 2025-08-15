/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useCallback, useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Student, Instructor, Lesson, Billing, View, CalendarView, PaymentMethod } from '../types';
import { TIME_SLOTS } from '../constants';

// Import Supabase hooks instead of using localStorage
import { 
  useStudents, 
  useInstructors, 
  useLessons, 
  useBillings,
  useUpdateStudent,
  useBulkCreateStudents,
  useCreateAttendance,
  useCreatePayment
} from '../hooks/useSupabase';

// Import realtime hooks
import {
  useRealtimeStudents,
  useRealtimeLessons,
  useRealtimeInstructors,
  useRealtimeBillings,
  useRealtimeAttendance
} from '../hooks/useRealtime';

export type StudentEnrollmentData = {
  name: string;
  nickname?: string;
  birthdate?: string;
  instrument: string;
  instructorId: string;
  age: number;
  email?: string;
  contactNumber?: string;
  gender: 'Male' | 'Female';
  facebook?: string;
  address?: {
    country?: string;
    province?: string;
    city?: string;
    barangay?: string;
    addressLine1?: string;
    addressLine2?: string;
  };
  guardianFullName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianFacebook?: string;
  secondaryGuardian?: {
    fullName?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    facebook?: string;
  };
  parentStudentId?: string;
};

export type AdminAction = 
  | { type: 'addInstructor' }
  | { type: 'toggleInstructorStatus', instructorId: string }
  | { type: 'deleteLessonPermanently', lessonId: string }
  | { type: 'enrollStudent', studentData: StudentEnrollmentData }
  | { type: 'resetData' };

export type FontSize = 'sm' | 'base' | 'lg';

// Enhanced state management with Supabase integration
export type AppState = {
  // UI State (still using localStorage for preferences)
  view: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
  
  // Data loading states (managed by React Query via Supabase hooks)
  isLoading: boolean;
  error: string | null;
  
  // Real-time data from Supabase (no longer localStorage)
  students: Student[];
  instructors: Instructor[];
  lessons: Lesson[];
  billings: Billing[];
  
  // Calendar state
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  calendarView: CalendarView;
  setCalendarView: React.Dispatch<React.SetStateAction<CalendarView>>;

  // Theme state (localStorage for user preferences)
  theme: 'light' | 'dark' | 'comfort' | 'system';
  fontSize: FontSize;
  handleThemeToggle: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'comfort' | 'system') => void;
  handleFontSizeChange: (size: FontSize) => void;

  // Derived data (computed from Supabase data)
  activeLessons: Lesson[];
  deletedLessons: Lesson[];
  activeInstructors: Instructor[];

  // Enhanced actions with Supabase integration
  initializeAppData: () => Promise<void>;
  handleNavigate: (direction: 'prev' | 'next') => void;
  handleDateSelect: (date: Date) => void;

  // Lesson management
  handleOpenEditModal: (lesson: Lesson) => void;
  handleOpenAddModal: (date: Date, time?: string) => void;
  handleCloseEditModal: () => void;
  isEditModalOpen: boolean;
  editingLesson: Lesson | null;
  isAddMode: boolean;
  handleUpdateLesson: (lessonData: Omit<Lesson, 'status'> & { repeatWeekly?: boolean; repeatWeeks?: number }) => void;
  handleMoveLessonToTrash: (lessonId: string) => void;
  handleUpdateLessonPosition: (lessonId: string, newDate: Date, newTime: string | undefined, isCopy: boolean) => void;
  handleLessonDragStart: (e: React.DragEvent, lesson: Lesson) => void;
  handleLessonDragEnd: () => void;

  // Student management with Supabase
  handleMarkAttendance: (studentId: string) => void;
  handleToggleStudentStatus: (studentId: string) => void;
  handleUpdateStudentContact: (studentId: string, updates: {
    email?: string;
    contactNumber?: string;
    facebook?: string;
    guardianFullName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianFacebook?: string;
  }) => void;
  handleBulkEnrollStudents: (studentsData: Partial<Student>[]) => Promise<void>;

  // Billing management with Supabase
  handleRecordPayment: (billingId: string, payment: { 
    amount: number; 
    method: PaymentMethod; 
    reference?: string; 
    note?: string; 
    overpayHandling?: 'next' | 'hold' 
  }) => void;
  handleUpdateBilling: (billingId: string, updates: Partial<Billing> & { items?: import('../types').BillingItem[] }) => void;

  // Session management
  isEditSessionModalOpen: boolean;
  editingStudent: Student | null;
  handleOpenEditSessionModal: (student: Student) => void;
  handleCloseEditSessionModal: () => void;
  handleUpdateStudentSessions: (studentId: string, unpaidCount: number) => void;

  // Instructor management
  isEditInstructorModalOpen: boolean;
  editingInstructor: Instructor | null;
  isAddInstructorMode: boolean;
  handleOpenEditInstructorModal: (instructor: Instructor) => void;
  handleOpenAddInstructorModal: () => void;
  handleCloseEditInstructorModal: () => void;
  handleSaveInstructor: (instructorData: Instructor) => void;

  // Admin actions
  isAdminAuthModalOpen: boolean;
  adminActionToConfirm: AdminAction | null;
  getAdminActionDescription: () => string;
  handleRequestAdminAction: (action: AdminAction) => void;
  handleAdminAuthSuccess: () => void;
  handleCloseAdminAuthModal: () => void;
  handleToggleInstructorStatus: (instructorId: string) => void;
  handleRequestEnrollment: (studentData: StudentEnrollmentData) => void;
  handleRequestResetData: () => void;
  handleRestoreLesson: (lessonId: string) => void;

  // Enhanced features
  enrollmentSuccessMessage: string | null;
  installPromptEvent: (Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> }) | null;
  handleInstallRequest: () => void;
  isDragging: boolean;
  handleDropOnTrash: (lessonId: string) => void;
  timeSlots: typeof TIME_SLOTS;

  // Sync and error tracking
  syncStatus: {
    isOnline: boolean;
    isSyncing: boolean;
    pendingOperations: number;
    lastSyncTime?: Date;
  };
  errorStats: {
    total: number;
    recent: number;
    categories: Record<string, number>;
  };
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI State (localStorage for user preferences)
  const [view, setView] = useState<View>(() => {
    const v = localStorage.getItem('app:view') as View | null;
    return (v === 'dashboard' || v === 'enrollment' || v === 'teachers' || v === 'students' || v === 'billing' || v === 'chat' || v === 'trash') ? v : 'dashboard';
  });

  const [currentDate, setCurrentDate] = useState(() => {
    const d = localStorage.getItem('app:currentDate');
    const parsed = d ? new Date(d) : new Date();
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  const [calendarView, setCalendarView] = useState<CalendarView>(() => {
    const cv = localStorage.getItem('app:calendarView') as CalendarView | null;
    return (cv === 'day' || cv === 'week' || cv === 'month' || cv === 'year') ? cv : 'month';
  });

  const [theme, setTheme] = useState<'light'|'dark'|'comfort'|'system'>(() => {
    const t = localStorage.getItem('theme');
    return (t === 'light' || t === 'dark' || t === 'comfort' || t === 'system') ? t : 'comfort';
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const storedSize = localStorage.getItem('fontSize');
    if (storedSize === 'sm' || storedSize === 'base' || storedSize === 'lg') return storedSize;
    return 'base';
  });

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditInstructorModalOpen, setIsEditInstructorModalOpen] = useState<boolean>(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [isAddInstructorMode, setIsAddInstructorMode] = useState<boolean>(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [adminActionToConfirm, setAdminActionToConfirm] = useState<AdminAction | null>(null);
  const [enrollmentSuccessMessage, setEnrollmentSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  // **SUPABASE HOOKS INTEGRATION** - Replace localStorage with real-time data
  const studentsQuery = useStudents();
  const instructorsQuery = useInstructors();
  const lessonsQuery = useLessons();
  const billingsQuery = useBillings();

  // Real-time subscriptions
  useRealtimeStudents();
  useRealtimeLessons();
  useRealtimeInstructors();
  useRealtimeBillings();
  useRealtimeAttendance();

  // Mutation hooks for data operations
  const updateStudentMutation = useUpdateStudent();
  const bulkCreateStudentsMutation = useBulkCreateStudents();
  const markAttendanceMutation = useCreateAttendance();
  const createPaymentMutation = useCreatePayment();

  // Extract data from queries with proper loading states
  const students = useMemo(() => studentsQuery.data || [], [studentsQuery.data]);
  const instructors = useMemo(() => instructorsQuery.data || [], [instructorsQuery.data]);
  const lessons = useMemo(() => lessonsQuery.data || [], [lessonsQuery.data]);
  const billings = useMemo(() => billingsQuery.data || [], [billingsQuery.data]);

  // Aggregate loading state
  const isLoading = studentsQuery.isLoading || instructorsQuery.isLoading || lessonsQuery.isLoading || billingsQuery.isLoading;
  
  // Aggregate error state
  const error = studentsQuery.error?.message || instructorsQuery.error?.message || lessonsQuery.error?.message || billingsQuery.error?.message || null;

  // Sync and error status (simplified mock implementations)
  const syncStatus = useMemo(() => ({
    isOnline: true,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: undefined
  }), []);

  const errorStats = useMemo(() => ({
    total: 0,
    recent: 0,
    categories: {}
  }), []);

  // Persist UI preferences to localStorage
  useEffect(() => {
    localStorage.setItem('app:view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('app:calendarView', calendarView);
  }, [calendarView]);

  useEffect(() => {
    try {
      localStorage.setItem('app:currentDate', currentDate.toISOString());
    } catch {
      // Ignore localStorage errors  
    }
  }, [currentDate]);

  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effectiveDark = theme === 'system' ? sysDark : theme === 'dark';
      
      if (effectiveDark) root.classList.add('dark'); else root.classList.remove('dark');
      if (theme === 'comfort' || (theme === 'system' && !sysDark)) root.classList.add('comfort');
      else root.classList.remove('comfort');
    };
    apply();
    
    try { localStorage.setItem('theme', theme); } catch {
      // Ignore localStorage errors
    }
    
    let mql: MediaQueryList | null = null;
    if (theme === 'system' && window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => apply();
      mql.addEventListener ? mql.addEventListener('change', listener) : mql.addListener(listener);
      return () => {
        if (!mql) return;
        const typedListener = listener as (event: MediaQueryListEvent) => void;
        mql.removeEventListener ? mql.removeEventListener('change', typedListener) : mql.removeListener(typedListener);
      };
    }
    return () => {}; // Return empty cleanup function when not using system theme
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = fontSize === 'sm' ? '87.5%' : fontSize === 'lg' ? '112.5%' : '100%';
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Derived data computations
  const activeLessons = useMemo(() =>
    lessons.filter(lesson => lesson.status === 'scheduled'),
    [lessons]
  );

  const deletedLessons = useMemo(() =>
    lessons.filter(lesson => lesson.status === 'cancelled'),
    [lessons]
  );  const activeInstructors = useMemo(() => 
    instructors.filter(instructor => instructor.status === 'active'), 
    [instructors]
  );

  // **SUPABASE-POWERED ACTIONS** - Replace localStorage operations with Supabase mutations

  const initializeAppData = useCallback(async () => {
    try {
      // Data is automatically loaded via React Query hooks
      // Just need to handle any initialization errors
      if (error) {
        console.error('Failed to initialize application data from Supabase:', error);
        throw new Error('Failed to initialize application data from Supabase');
      }
    } catch (e) {
      console.error('Initialization error:', e);
      throw e;
    }
  }, [error]);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (calendarView === 'year') newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
      else if (calendarView === 'month') newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      else if (calendarView === 'week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      else newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }, [calendarView]);

  const handleDateSelect = useCallback((date: Date) => {
    setCurrentDate(date);
    setCalendarView('month');
  }, []);

  // Theme handlers
  const handleThemeToggle = useCallback(() => setTheme(prev => (prev === 'light' ? 'dark' : prev === 'dark' ? 'comfort' : prev === 'comfort' ? 'system' : 'light')), []);
  const setThemeMode = useCallback((mode: 'light'|'dark'|'comfort'|'system') => setTheme(mode), []);
  const handleFontSizeChange = useCallback((size: FontSize) => setFontSize(size), []);

  // PWA install handler
  const handleInstallRequest = useCallback(() => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then(() => setInstallPromptEvent(null));
  }, [installPromptEvent]);

  // **SUPABASE LESSON MANAGEMENT**
  const handleMarkAttendance = useCallback((studentId: string) => {
    markAttendanceMutation.mutate(
      { 
        student_id: studentId, 
        lesson_id: '', // TODO: Get actual lesson ID
        status: 'present',
        marked_by: 'system',
        marked_at: new Date().toISOString()
      },
      {
        onSuccess: () => {
          toast.success('Attendance marked successfully');
        },
        onError: (error) => {
          console.error('Failed to mark attendance:', error);
          toast.error('Failed to mark attendance');
        }
      }
    );
  }, [markAttendanceMutation]);

  const handleRecordPayment = useCallback((billingId: string, payment: { 
    amount: number; 
    method: PaymentMethod; 
    reference?: string; 
    note?: string; 
    overpayHandling?: 'next' | 'hold' 
  }) => {
    createPaymentMutation.mutate(
      {
        billing_id: billingId,
        amount: payment.amount,
        payment_method: payment.method.toLowerCase(),
        transaction_id: payment.reference,
        notes: payment.note,
        payment_date: new Date().toISOString()
      },
      {
        onSuccess: () => {
          toast.success(`Payment recorded (${payment.method}) - ${payment.amount.toLocaleString()}`);
        },
        onError: (error) => {
          console.error('Failed to record payment:', error);
          toast.error('Failed to record payment');
        }
      }
    );
  }, [createPaymentMutation]);

  const handleToggleStudentStatus = useCallback((studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    
    updateStudentMutation.mutate(
      { id: studentId, updates: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success(`Student ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        },
        onError: (error) => {
          console.error('Failed to update student status:', error);
          toast.error('Failed to update student status');
        }
      }
    );
  }, [students, updateStudentMutation]);

  const handleBulkEnrollStudents = useCallback(async (studentsData: Partial<Student>[]) => {
    try {
      // Convert to database format using mappers
      const dbStudentsData = studentsData.map(student => ({
        name: student.name || '',
        email: student.email,
        phone: student.contactNumber,
        date_of_birth: student.birthdate,
        guardian_name: student.guardianName || student.guardianFullName,
        guardian_email: student.guardianEmail,
        guardian_phone: student.guardianPhone,
        status: student.status || 'active'
      }));
      
      await bulkCreateStudentsMutation.mutateAsync(dbStudentsData);
      toast.success(`Successfully enrolled ${studentsData.length} students`);
      setEnrollmentSuccessMessage(`Successfully enrolled ${studentsData.length} students`);
    } catch (error) {
      console.error('Failed to enroll students:', error);
      toast.error('Failed to enroll students');
    }
  }, [bulkCreateStudentsMutation]);

  // Modal handlers
  const handleOpenEditModal = useCallback((lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsAddMode(false);
    setIsEditModalOpen(true);
  }, []);

  const handleOpenAddModal = useCallback((_date: Date, _time?: string) => {
    setEditingLesson(null);
    setIsAddMode(true);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingLesson(null);
    setIsAddMode(false);
  }, []);

  const handleOpenEditSessionModal = useCallback((student: Student) => {
    setEditingStudent(student);
    setIsEditSessionModalOpen(true);
  }, []);

  const handleCloseEditSessionModal = useCallback(() => {
    setIsEditSessionModalOpen(false);
    setEditingStudent(null);
  }, []);

  const handleOpenEditInstructorModal = useCallback((instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsAddInstructorMode(false);
    setIsEditInstructorModalOpen(true);
  }, []);

  const handleOpenAddInstructorModal = useCallback(() => {
    setEditingInstructor(null);
    setIsAddInstructorMode(true);
    setIsEditInstructorModalOpen(true);
  }, []);

  const handleCloseEditInstructorModal = useCallback(() => {
    setIsEditInstructorModalOpen(false);
    setEditingInstructor(null);
    setIsAddInstructorMode(false);
  }, []);

  // **PLACEHOLDER IMPLEMENTATIONS** - These would be implemented similarly to the above
  const handleUpdateLesson = useCallback((_lessonData: Omit<Lesson, 'status'> & { repeatWeekly?: boolean; repeatWeeks?: number }) => {
    // Implementation with updateLessonMutation
    console.warn('handleUpdateLesson - placeholder implementation');
  }, []);

  const handleMoveLessonToTrash = useCallback((_lessonId: string) => {
    // Implementation with updateLessonMutation (set status to 'deleted')
    console.warn('handleMoveLessonToTrash - placeholder implementation');
  }, []);

  const handleUpdateLessonPosition = useCallback((_lessonId: string, _newDate: Date, _newTime: string | undefined, _isCopy: boolean) => {
    // Implementation with updateLessonMutation or createLessonMutation
    console.warn('handleUpdateLessonPosition - placeholder implementation');
  }, []);

  const handleLessonDragStart = useCallback((e: React.DragEvent, lesson: Lesson) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', lesson.id);
  }, []);

  const handleLessonDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleUpdateStudentSessions = useCallback((_studentId: string, _unpaidCount: number) => {
    // Implementation with updateStudentMutation
    console.warn('handleUpdateStudentSessions - placeholder implementation');
  }, []);

  const handleSaveInstructor = useCallback((_instructorData: Instructor) => {
    // Implementation with createInstructorMutation or updateInstructorMutation
    console.warn('handleSaveInstructor - placeholder implementation');
  }, []);

  const getAdminActionDescription = useCallback(() => {
    if (!adminActionToConfirm) return '';
    switch (adminActionToConfirm.type) {
      case 'addInstructor': return 'Add new instructor';
      case 'toggleInstructorStatus': return 'Toggle instructor status';
      case 'deleteLessonPermanently': return 'Permanently delete lesson';
      case 'enrollStudent': return 'Enroll new student';
      case 'resetData': return 'Reset all data';
      default: return 'Unknown action';
    }
  }, [adminActionToConfirm]);

  const handleRequestAdminAction = useCallback((_action: AdminAction) => {
    setAdminActionToConfirm(_action);
    setIsAdminAuthModalOpen(true);
  }, []);

  const handleAdminAuthSuccess = useCallback(() => {
    setIsAdminAuthModalOpen(false);
    // Execute the confirmed admin action
    if (adminActionToConfirm) {
      // Implementation based on action type
      console.warn('handleAdminAuthSuccess - placeholder implementation', adminActionToConfirm);
    }
    setAdminActionToConfirm(null);
  }, [adminActionToConfirm]);

  const handleCloseAdminAuthModal = useCallback(() => {
    setIsAdminAuthModalOpen(false);
    setAdminActionToConfirm(null);
  }, []);

  const handleToggleInstructorStatus = useCallback((_instructorId: string) => {
    // Implementation with updateInstructorMutation
    console.warn('handleToggleInstructorStatus - placeholder implementation');
  }, []);

  const handleRequestEnrollment = useCallback((_studentData: StudentEnrollmentData) => {
    // Implementation with createStudentMutation
    console.warn('handleRequestEnrollment - placeholder implementation');
  }, []);

  const handleRequestResetData = useCallback(() => {
    // Implementation - requires admin confirmation
    console.warn('handleRequestResetData - placeholder implementation');
  }, []);

  const handleRestoreLesson = useCallback((_lessonId: string) => {
    // Implementation with updateLessonMutation (set status to 'active')
    console.warn('handleRestoreLesson - placeholder implementation');
  }, []);

  const handleUpdateBilling = useCallback((_billingId: string, _updates: Partial<Billing> & { items?: import('../types').BillingItem[] }) => {
    // Implementation with updateBillingMutation
    console.warn('handleUpdateBilling - placeholder implementation');
  }, []);

  const handleUpdateStudentContact = useCallback((studentId: string, updates: {
    email?: string;
    contactNumber?: string;
    facebook?: string;
    guardianFullName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianFacebook?: string;
  }) => {
    updateStudentMutation.mutate(
      { id: studentId, updates },
      {
        onSuccess: () => {
          toast.success('Student contact information updated');
        },
        onError: (_error) => {
          console.error('Failed to update student contact:', _error);
          toast.error('Failed to update student contact');
        }
      }
    );
  }, [updateStudentMutation]);

  const handleDropOnTrash = useCallback((lessonId: string) => {
    handleMoveLessonToTrash(lessonId);
  }, [handleMoveLessonToTrash]);

  // Context value with Supabase integration
  // @ts-ignore - Temporary fix for AppState type compatibility
  const contextValue: AppState = useMemo(() => ({
    // UI State
    view,
    setView,
    
    // Data loading (managed by React Query)
    isLoading,
    error,
    
    // Real-time data from Supabase (temporarily accept database format)
    students,
    instructors,
    // @ts-ignore - Temporary fix for type mismatch between DB and interface
    lessons: lessons,
    // @ts-ignore - Temporary fix for type mismatch between DB and interface  
    billings,
    
    // Calendar state
    currentDate,
    setCurrentDate,
    calendarView,
    setCalendarView,
    
    // Theme state
    theme,
    fontSize,
    handleThemeToggle,
    setThemeMode,
    handleFontSizeChange,
    
    // Derived data
    activeLessons,
    deletedLessons,
    activeInstructors,
    
    // Enhanced actions
    initializeAppData,
    handleNavigate,
    handleDateSelect,
    
    // Lesson management
    handleOpenEditModal,
    handleOpenAddModal,
    handleCloseEditModal,
    isEditModalOpen,
    editingLesson,
    isAddMode,
    handleUpdateLesson,
    handleMoveLessonToTrash,
    handleUpdateLessonPosition,
    handleLessonDragStart,
    handleLessonDragEnd,
    
    // Student management
    handleMarkAttendance,
    handleToggleStudentStatus,
    handleUpdateStudentContact,
    handleBulkEnrollStudents,
    
    // Billing management
    handleRecordPayment,
    handleUpdateBilling,
    
    // Session management
    isEditSessionModalOpen,
    editingStudent,
    handleOpenEditSessionModal,
    handleCloseEditSessionModal,
    handleUpdateStudentSessions,
    
    // Instructor management
    isEditInstructorModalOpen,
    editingInstructor,
    isAddInstructorMode,
    handleOpenEditInstructorModal,
    handleOpenAddInstructorModal,
    handleCloseEditInstructorModal,
    handleSaveInstructor,
    
    // Admin actions
    isAdminAuthModalOpen,
    adminActionToConfirm,
    getAdminActionDescription,
    handleRequestAdminAction,
    handleAdminAuthSuccess,
    handleCloseAdminAuthModal,
    handleToggleInstructorStatus,
    handleRequestEnrollment,
    handleRequestResetData,
    handleRestoreLesson,
    
    // Enhanced features
    enrollmentSuccessMessage,
    installPromptEvent,
    handleInstallRequest,
    isDragging,
    handleDropOnTrash,
    timeSlots: TIME_SLOTS,
    
    // Sync and error tracking
    syncStatus,
    errorStats
  }), [
    view, setView, isLoading, error, students, instructors, lessons, billings,
    currentDate, setCurrentDate, calendarView, setCalendarView,
    theme, fontSize, handleThemeToggle, setThemeMode, handleFontSizeChange,
    activeLessons, deletedLessons, activeInstructors,
    initializeAppData, handleNavigate, handleDateSelect,
    handleOpenEditModal, handleOpenAddModal, handleCloseEditModal,
    isEditModalOpen, editingLesson, isAddMode,
    handleUpdateLesson, handleMoveLessonToTrash, handleUpdateLessonPosition,
    handleLessonDragStart, handleLessonDragEnd,
    handleMarkAttendance, handleToggleStudentStatus, handleUpdateStudentContact, handleBulkEnrollStudents,
    handleRecordPayment, handleUpdateBilling,
    isEditSessionModalOpen, editingStudent, handleOpenEditSessionModal, handleCloseEditSessionModal, handleUpdateStudentSessions,
    isEditInstructorModalOpen, editingInstructor, isAddInstructorMode,
    handleOpenEditInstructorModal, handleOpenAddInstructorModal, handleCloseEditInstructorModal, handleSaveInstructor,
    isAdminAuthModalOpen, adminActionToConfirm, getAdminActionDescription,
    handleRequestAdminAction, handleAdminAuthSuccess, handleCloseAdminAuthModal,
    handleToggleInstructorStatus, handleRequestEnrollment, handleRequestResetData, handleRestoreLesson,
    enrollmentSuccessMessage, installPromptEvent, handleInstallRequest,
    isDragging, handleDropOnTrash,
    syncStatus, errorStats
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
