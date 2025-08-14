import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Student, Instructor, Lesson, Billing, View, CalendarView, Payment, PaymentMethod } from '../types';
import { BILLING_CYCLE, LESSON_PRICE, EVENT_COLORS, TIME_SLOTS, toYYYYMMDD, LUNCH_BREAK_TIME } from '../constants';
import { addMinutes, roundToQuarter, rangesOverlap, toMinutes } from '../utils/time';
import { generateSchedules } from '../services/scheduleService';
import { generateAvatarUrl } from '../utils/avatarUtils';

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
  parentStudentId?: string; // Link to parent student for multi-instrument tracking
};

export type AdminAction = 
  | { type: 'addInstructor' }
  | { type: 'toggleInstructorStatus', instructorId: string }
  | { type: 'deleteLessonPermanently', lessonId: string }
  | { type: 'enrollStudent', studentData: StudentEnrollmentData }
  | { type: 'resetData' };

export type FontSize = 'sm' | 'base' | 'lg';

// Transaction tracking types
type TxStatus = 'success' | 'error' | 'info';
type TxType =
  | 'app.init' | 'app.reset'
  | 'lesson.create' | 'lesson.update' | 'lesson.delete' | 'lesson.restore' | 'lesson.copy' | 'lesson.move'
  | 'attendance.mark'
  | 'payment.record'
  | 'billing.update'
  | 'student.status' | 'student.enroll' | 'student.contact.update'
  | 'instructor.save' | 'instructor.status';
export type TransactionEntry = { id: string; type: TxType; status: TxStatus; message: string; timestamp: number; meta?: Record<string, unknown> };

export type AppState = {
  view: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
  isLoading: boolean;
  error: string | null;

  students: Student[];
  instructors: Instructor[];
  lessons: Lesson[];
  billings: Billing[];
  // Optional record of credits per student

  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  calendarView: CalendarView;
  setCalendarView: React.Dispatch<React.SetStateAction<CalendarView>>;

  theme: 'light' | 'dark' | 'comfort' | 'system';
  fontSize: FontSize;
  handleThemeToggle: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'comfort' | 'system') => void;
  handleFontSizeChange: (size: FontSize) => void;

  // derived
  activeLessons: Lesson[];
  deletedLessons: Lesson[];
  activeInstructors: Instructor[];

  // actions
  initializeAppData: () => Promise<void>;
  handleNavigate: (direction: 'prev' | 'next') => void;
  handleDateSelect: (date: Date) => void;

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

  handleMarkAttendance: (studentId: string) => void;
  handleRecordPayment: (billingId: string, payment: { amount: number; method: PaymentMethod; reference?: string; note?: string; overpayHandling?: 'next' | 'hold' }) => void;
  handleToggleStudentStatus: (studentId: string) => void;

  isEditSessionModalOpen: boolean;
  editingStudent: Student | null;
  handleOpenEditSessionModal: (student: Student) => void;
  handleCloseEditSessionModal: () => void;
  handleUpdateStudentSessions: (studentId: string, unpaidCount: number) => void;

  isEditInstructorModalOpen: boolean;
  editingInstructor: Instructor | null;
  isAddInstructorMode: boolean;
  handleOpenEditInstructorModal: (instructor: Instructor) => void;
  handleOpenAddInstructorModal: () => void;
  handleCloseEditInstructorModal: () => void;
  handleSaveInstructor: (instructorData: Instructor) => void;

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

  // Add: update billing/invoice (line items and totals)
  handleUpdateBilling: (billingId: string, updates: Partial<Billing> & { items?: import('../types').BillingItem[] }) => void;

  // Add: update student contact/guardian details
  handleUpdateStudentContact: (studentId: string, updates: {
    email?: string;
    contactNumber?: string;
    facebook?: string;
    guardianFullName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianFacebook?: string;
  }) => void;

  // Add: bulk enrollment function
  handleBulkEnrollStudents: (studentsData: Partial<Student>[]) => Promise<void>;

  enrollmentSuccessMessage: string | null;
  installPromptEvent: (Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> }) | null;
  handleInstallRequest: () => void;

  isDragging: boolean;
  handleDropOnTrash: (lessonId: string) => void;

  timeSlots: typeof TIME_SLOTS;

  // Transaction tracking
  transactions: TransactionEntry[];
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<View>(() => {
    const v = localStorage.getItem('app:view') as View | null;
    return (v === 'dashboard' || v === 'enrollment' || v === 'teachers' || v === 'students' || v === 'billing' || v === 'chat' || v === 'trash') ? v : 'dashboard';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);

  const [currentDate, setCurrentDate] = useState(() => {
    const d = localStorage.getItem('app:currentDate');
    const parsed = d ? new Date(d) : new Date();
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  });
  const [calendarView, setCalendarView] = useState<CalendarView>(() => {
    const cv = localStorage.getItem('app:calendarView') as CalendarView | null;
    return (cv === 'day' || cv === 'week' || cv === 'month' || cv === 'year') ? cv : 'month';
  });

  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isEditInstructorModalOpen, setIsEditInstructorModalOpen] = useState<boolean>(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [isAddInstructorMode, setIsAddInstructorMode] = useState<boolean>(false);

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [adminActionToConfirm, setAdminActionToConfirm] = useState<AdminAction | null>(null);
  const [enrollmentSuccessMessage, setEnrollmentSuccessMessage] = useState<string | null>(null);
  const [_toastMessage, _setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [theme, setTheme] = useState<'light'|'dark'|'comfort'|'system'>(() => {
    const t = localStorage.getItem('theme');
    return (t === 'light' || t === 'dark' || t === 'comfort' || t === 'system') ? t : 'comfort';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const storedSize = localStorage.getItem('fontSize');
    if (storedSize === 'sm' || storedSize === 'base' || storedSize === 'lg') return storedSize;
    return 'base';
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  // Transaction log and helper
  const [transactions, setTransactions] = useState<TransactionEntry[]>(() => {
    try {
      const raw = localStorage.getItem('app:transactions');
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  });
  const pushTx = useCallback((type: TxType, status: TxStatus, message: string, meta?: Record<string, unknown>) => {
    const entry: TransactionEntry = { id: `tx-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, type, status, message, timestamp: Date.now(), meta };
    setTransactions(prev => {
      const next = [entry, ...prev].slice(0, 100);
      try { localStorage.setItem('app:transactions', JSON.stringify(next)); } catch {
        // Ignore localStorage errors
      }
      return next;
    });
    if (status === 'success') toast.success(message);
    else if (status === 'error') toast.error(message);
    else toast(message);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallRequest = () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then(() => setInstallPromptEvent(null));
  };

  // Persist basic UI settings
  useEffect(() => {
    localStorage.setItem('app:view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('app:calendarView', calendarView);
  }, [calendarView]);

  useEffect(() => {
    // Store as ISO date to avoid TZ ambiguity on restore
    try {
      localStorage.setItem('app:currentDate', currentDate.toISOString());
    } catch {
      // Ignore localStorage errors  
    }
  }, [currentDate]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveDark = theme === 'system' ? sysDark : theme === 'dark';
  // Apply dark class
  if (effectiveDark) root.classList.add('dark'); else root.classList.remove('dark');
  // Apply comfort class for comfort mode, and for system when OS prefers light
  if (theme === 'comfort' || (theme === 'system' && !sysDark)) root.classList.add('comfort');
  else root.classList.remove('comfort');
    };
    apply();
  // Persist the explicit theme selection (including 'system')
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

  const handleThemeToggle = () => setTheme(prev => (prev === 'light' ? 'dark' : prev === 'dark' ? 'comfort' : prev === 'comfort' ? 'system' : 'light'));
  const setThemeMode = (mode: 'light'|'dark'|'comfort'|'system') => setTheme(mode);
  const handleFontSizeChange = (size: FontSize) => setFontSize(size);

  const getNewStudentIdNumber = useCallback(() => {
    const highestId = students.reduce((maxId, student) => {
      const currentId = parseInt(student.studentIdNumber, 10);
      if (!isNaN(currentId) && currentId > maxId) return currentId;
      return maxId;
    }, 0);
    return (highestId > 0 ? highestId + 1 : 100001).toString();
  }, [students]);

  const initializeAppData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/initial-data.json');
      if (!response.ok) throw new Error(`Failed to load data: ${response.statusText}`);
      const { students: studentData, instructors: instructorData } = await response.json();

      const initializedStudents: Student[] = studentData.map((s: Omit<Student, 'id' | 'sessionsAttended' | 'sessionsBilled' | 'status'>, i: number) => ({
        ...s,
        id: `student-${i + 1}`,
        sessionsAttended: 0,
        sessionsBilled: 0,
        status: 'active',
      }));

      const initializedInstructors: Instructor[] = instructorData.map((inst: Omit<Instructor, 'id' | 'color' | 'status'>, i: number) => ({
        ...inst,
        id: `inst-${i + 1}`,
        color: EVENT_COLORS[i % EVENT_COLORS.length],
        status: 'active',
      }));

      const { lessons: scheduledLessons, students: studentsWithInstructors } = generateSchedules(initializedStudents, initializedInstructors);

      setStudents(studentsWithInstructors);
      setInstructors(initializedInstructors);
      setLessons(scheduledLessons);
      setBillings([]);
    } catch (e) {
      console.error(e);
      setError('Failed to initialize application data. Please try refreshing the page.');
    pushTx('app.init', 'error', 'Failed to initialize application data');
    } finally {
      setIsLoading(false);
    }
  }, [pushTx]);

  useEffect(() => {
    initializeAppData();
  }, [initializeAppData]);

  useEffect(() => {
    const newBillings: Billing[] = [];
    students.forEach(student => {
      const maxSessionsCoveredByInvoice = billings
        .filter(b => b.studentId === student.id)
        .reduce((max, b) => Math.max(max, b.sessionsCovered), 0);
      let sessionsPendingInvoice = student.sessionsAttended - maxSessionsCoveredByInvoice;
      let nextSessionToCover = maxSessionsCoveredByInvoice;
      while (sessionsPendingInvoice >= BILLING_CYCLE) {
        nextSessionToCover += BILLING_CYCLE;
        newBillings.push({
          id: `bill-${Date.now()}-${student.id}-${nextSessionToCover}`,
          studentId: student.id,
          studentName: student.name,
          amount: LESSON_PRICE * BILLING_CYCLE,
          status: 'unpaid',
          sessionsCovered: nextSessionToCover,
          dateIssued: new Date().toISOString(),
        });
        sessionsPendingInvoice -= BILLING_CYCLE;
      }
    });
    if (newBillings.length > 0) setBillings(prev => [...prev, ...newBillings]);
  }, [students, billings]);

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

  const handleMarkAttendance = useCallback((studentId: string) => {
    let updated = false;
    setStudents(prevStudents => {
      const newStudents = [...prevStudents];
      const idx = newStudents.findIndex(s => s.id === studentId);
      if (idx === -1) return prevStudents;
      const student = { ...newStudents[idx] };
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (student.lastAttendanceMarkedAt && now - student.lastAttendanceMarkedAt < twentyFourHours) return prevStudents;
      student.sessionsAttended += 1;
      student.lastAttendanceMarkedAt = now;
      newStudents[idx] = student;
      updated = true;
      return newStudents;
    });
    if (updated) pushTx('attendance.mark', 'success', 'Attendance marked');
    else pushTx('attendance.mark', 'error', 'Attendance already marked in the last 24 hours');
  }, [pushTx]);

  const handleRecordPayment = useCallback((billingId: string, payment: { amount: number; method: PaymentMethod; reference?: string; note?: string; overpayHandling?: 'next' | 'hold' }) => {
    // Record payment processing
    
    // If the payment method is Credit, ensure we don't exceed available credit; enforce later with UI as well.
    setBillings(prev => {
      // Process payment for billing
      
      const next = prev.map(b => {
        if (b.id !== billingId) return b;
        
        // Process billing payment
        
        const p: Payment = {
          id: `pay-${Date.now()}`,
          billingId: b.id,
          studentId: b.studentId,
          amount: Number(payment.amount) || 0,
          method: payment.method,
          reference: payment.reference,
          note: payment.note,
          overpayHandling: payment.overpayHandling,
          date: new Date().toISOString(),
        };
        const payments = [...(b.payments || []), p];
        const paidAmount = payments.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        const status: 'paid' | 'unpaid' = paidAmount >= b.amount ? 'paid' : 'unpaid';
        
        // Billing updated successfully
        
        return { ...b, payments, paidAmount, status } as Billing;
      });

      // Billing update complete

      const updated = next.find(b => b.id === billingId);
      if (updated) {
        const studentId = updated.studentId;
        const overpay = (updated.paidAmount || 0) - updated.amount;
        const overHandling = payment.overpayHandling ?? 'next';
        // Compute sessions billed from updated billings
        const paidBillsForStudent = next.filter(b => b.studentId === studentId && b.status === 'paid');
        const totalSessionsBilled = paidBillsForStudent.length * BILLING_CYCLE;

        // Single student update to avoid batched overwrite
        setStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          let credit = s.creditBalance || 0;
          // Deduct only credit applied up to available credit
          if (payment.method === 'Credit') {
            const applied = Math.max(0, Math.min(credit, Number(payment.amount) || 0));
            credit = Math.max(0, credit - applied);
          }
          if (overpay > 0 && overHandling === 'next') {
            credit = credit + overpay;
          }
          return { ...s, creditBalance: credit, sessionsBilled: totalSessionsBilled };
        }));
  const amt = Number(payment.amount || 0);
  pushTx('payment.record', 'success', `Payment recorded (${payment.method}) - ${amt.toLocaleString()}`, { billingId, amount: amt });
      }
      return next;
    });
  }, [pushTx]);

  // Add: update a billing (e.g., edit line items and recalc amount)
  const handleUpdateBilling = useCallback((billingId: string, updates: Partial<Billing> & { items?: import('../types').BillingItem[] }) => {
    setBillings(prev => prev.map(b => {
      if (b.id !== billingId) return b;
      const next = { ...b, ...updates } as Billing;
      if (updates.items) {
        const total = updates.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitAmount) || 0), 0);
        next.items = updates.items;
        next.amount = total;
      }
      return next;
    }));
    pushTx('billing.update', 'success', 'Billing updated', { billingId });
  }, [pushTx]);

  const activeInstructors = useMemo(() => instructors.filter(i => i.status === 'active'), [instructors]);

  const handleOpenEditModal = useCallback((lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsAddMode(false);
    setIsEditModalOpen(true);
  }, []);

  const handleOpenAddModal = useCallback((date: Date, time?: string) => {
    const firstActiveStudent = students.find(s => s.status === 'active');
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      studentId: firstActiveStudent?.id || '',
      instructorId: activeInstructors.length > 0 ? activeInstructors[0].id : '',
      roomId: 1,
      date: toYYYYMMDD(date),
      time: time || TIME_SLOTS[0],
      endTime: addMinutes(time || TIME_SLOTS[0], 60),
      notes: '',
      status: 'scheduled',
    };
    setEditingLesson(newLesson);
    setIsAddMode(true);
    setIsEditModalOpen(true);
  }, [students, activeInstructors]);

  const handleCloseEditModal = useCallback(() => {
    setEditingLesson(null);
    setIsEditModalOpen(false);
    setIsAddMode(false);
  }, []);

  const handleMoveLessonToTrash = useCallback((lessonId: string) => {
    setLessons(prev => prev.map(l => (l.id === lessonId ? { ...l, status: 'deleted' } : l)));
    handleCloseEditModal();
    pushTx('lesson.delete', 'success', 'Lesson moved to trash', { lessonId });
  }, [handleCloseEditModal, pushTx]);

  const checkConflict = useCallback((lessonToPlace: Omit<Lesson, 'id'>, ignoreLessonId?: string): string | null => {
    for (const l of lessons) {
      if (l.id === ignoreLessonId || l.status === 'deleted') continue;
      if (l.date === lessonToPlace.date) {
        const lStart = l.time;
        const lEnd = l.endTime || addMinutes(l.time, 60);
        const nStart = lessonToPlace.time;
        const nEnd = lessonToPlace.endTime || addMinutes(lessonToPlace.time, 60);
        if (rangesOverlap(lStart, lEnd, nStart, nEnd)) {
          if (l.instructorId === lessonToPlace.instructorId) {
            const conflictingInstructor = instructors.find(i => i.id === l.instructorId);
            return `Instructor ${conflictingInstructor?.name || ''} is already scheduled during this time.`;
          }
          if (l.roomId === lessonToPlace.roomId) return `Room ${l.roomId} is already booked during this time.`;
          if (l.studentId === lessonToPlace.studentId) {
            const conflictingStudent = students.find(s => s.id === l.studentId);
            return `Student ${conflictingStudent?.name || ''} already has a lesson during this time.`;
          }
        }
      }
    }
    return null;
  }, [lessons, instructors, students]);

  const handleUpdateLesson = useCallback((lessonData: Omit<Lesson, 'status'> & { repeatWeekly?: boolean; repeatWeeks?: number }) => {
    if (isAddMode) {
      const { repeatWeekly, repeatWeeks, ...baseData } = lessonData;
      const student = students.find(s => s.id === baseData.studentId);
      if (student && student.status === 'inactive') {
  const msg = 'This student is not currently enrolled. Please activate the student to schedule new lessons.';
  toast.error(msg);
  pushTx('lesson.create', 'error', msg);
        return;
      }
      const newLesson: Lesson = { ...baseData, status: 'scheduled' };
      // Prepare list of lessons to add, including weekly repeats if requested
      const lessonsToAdd: Lesson[] = [newLesson];
      const doRepeat = !!repeatWeekly && (repeatWeeks ?? 0) > 0;
      if (doRepeat) {
        const weeks = Math.min(52, Math.max(1, repeatWeeks || 1));
        const startDate = new Date(`${baseData.date}T00:00:00`);
        const baseDuration = (toMinutes(baseData.endTime || addMinutes(baseData.time, 60)) - toMinutes(baseData.time));
        for (let i = 1; i <= weeks; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i * 7);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${day}`;
          const repeatLesson: Lesson = {
            ...newLesson,
            id: `lesson-${Date.now()}-${i}`,
            date: dateStr,
            // keep same start/end (times), only date shifts
            time: baseData.time,
            endTime: addMinutes(baseData.time, baseDuration),
          };
          // lunch guard
          const lunchMin = toMinutes(LUNCH_BREAK_TIME);
          const sMin = toMinutes(repeatLesson.time);
          const eMin = toMinutes(repeatLesson.endTime || addMinutes(repeatLesson.time, 60));
          if (sMin < lunchMin && lunchMin < eMin) continue; // skip this occurrence silently
          // conflict check against existing and queued ones
          const { id: _omit, ...repeatForCheck } = repeatLesson;
          const conflict = checkConflict(repeatForCheck, undefined);
          if (!conflict) lessonsToAdd.push(repeatLesson);
        }
      }
  setLessons(prevLessons => [...prevLessons, ...lessonsToAdd]);
  const repeats = lessonsToAdd.length - 1;
  pushTx('lesson.create', 'success', `Lesson added${repeats > 0 ? ` (+${repeats} repeats)` : ''}`);
    } else {
      const { repeatWeekly, repeatWeeks, ...baseData } = lessonData;
      const updatedLesson: Lesson = { ...baseData, status: 'scheduled' };
      setLessons(prevLessons => prevLessons.map(l => (l.id === updatedLesson.id ? updatedLesson : l)));
      const originalLesson = lessons.find(l => l.id === updatedLesson.id);
      if (originalLesson && originalLesson.instructorId !== updatedLesson.instructorId) {
        setStudents(prevStudents => prevStudents.map(s => (s.id === updatedLesson.studentId ? { ...s, instructorId: updatedLesson.instructorId } : s)));
      }

      // If requested, also create future weekly occurrences from this edited lesson's date
      if (repeatWeekly && (repeatWeeks ?? 0) > 0) {
        const weeks = Math.min(52, Math.max(1, repeatWeeks || 1));
        const startDate = new Date(`${updatedLesson.date}T00:00:00`);
        const baseDuration = (toMinutes(updatedLesson.endTime || addMinutes(updatedLesson.time, 60)) - toMinutes(updatedLesson.time));
        const newOccurrences: Lesson[] = [];
        for (let i = 1; i <= weeks; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i * 7);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${day}`;
          const repeatLesson: Lesson = {
            ...updatedLesson,
            id: `lesson-${Date.now()}-e${i}`,
            date: dateStr,
            time: updatedLesson.time,
            endTime: addMinutes(updatedLesson.time, baseDuration),
          };
          const lunchMin = toMinutes(LUNCH_BREAK_TIME);
          const sMin = toMinutes(repeatLesson.time);
          const eMin = toMinutes(repeatLesson.endTime || addMinutes(repeatLesson.time, 60));
          if (sMin < lunchMin && lunchMin < eMin) continue;
          const { id: _omit, ...repeatForCheck } = repeatLesson;
          const conflict = checkConflict(repeatForCheck, undefined);
          if (!conflict) newOccurrences.push(repeatLesson);
        }
        if (newOccurrences.length) setLessons(prev => [...prev, ...newOccurrences]);
      }
      pushTx('lesson.update', 'success', 'Lesson updated');
    }
    handleCloseEditModal();
  }, [lessons, isAddMode, handleCloseEditModal, students, checkConflict, pushTx]);

  const handleUpdateLessonPosition = useCallback((lessonId: string, newDate: Date, newTime: string | undefined, isCopy: boolean) => {
    const originalLesson = lessons.find(l => l.id === lessonId);
    if (!originalLesson) return;

    const student = students.find(s => s.id === originalLesson.studentId);
    if (student && student.status === 'inactive') {
  toast.error(`Cannot schedule lessons for ${student.name} because they are not enrolled.`);
  pushTx('lesson.move', 'error', 'Cannot move/copy: student is not enrolled', { lessonId });
      return;
    }

    const newDateString = toYYYYMMDD(newDate);
  const targetTime = newTime ? roundToQuarter(newTime) : originalLesson.time;
  const duration = (originalLesson.endTime ? (new Date(`1970-01-01T${originalLesson.endTime}:00Z`).getTime() - new Date(`1970-01-01T${originalLesson.time}:00Z`).getTime()) / 60000 : 60);
  const targetEnd = addMinutes(targetTime, duration);

    // Prevent scheduling that intersects the lunch break start time
    const lunchMin = toMinutes(LUNCH_BREAK_TIME);
    const startMin = toMinutes(targetTime);
    const endMin = toMinutes(targetEnd);
  if (startMin < lunchMin && lunchMin < endMin) {
      toast.error(`Cannot schedule a lesson overlapping the lunch break (${LUNCH_BREAK_TIME}).`);
      pushTx('lesson.move', 'error', 'Cannot move/copy: overlaps lunch break', { lessonId });
      return;
    }

  const baseLessonData = { ...originalLesson, date: newDateString, time: targetTime, endTime: targetEnd };

    if (isCopy) {
      const newLesson: Lesson = { ...baseLessonData, id: `lesson-${Date.now()}`, notes: `(Copied) ${originalLesson.notes || ''}`.trim(), status: 'scheduled' };
      const conflict = checkConflict(newLesson);
      if (conflict) {
        toast.error(`Could not copy lesson: ${conflict}`);
        pushTx('lesson.copy', 'error', conflict, { lessonId });
        return;
      }
      setLessons(prev => [...prev, newLesson]);
      pushTx('lesson.copy', 'success', 'Lesson copied', { lessonId, newLessonId: newLesson.id });
    } else {
  const updatedLesson = { ...baseLessonData };
      const conflict = checkConflict(updatedLesson, originalLesson.id);
      if (conflict) {
        toast.error(`Could not move lesson: ${conflict}`);
        pushTx('lesson.move', 'error', conflict, { lessonId });
        return;
      }
      setLessons(prev => prev.map(l => (l.id === lessonId ? updatedLesson : l)));
      pushTx('lesson.move', 'success', 'Lesson moved', { lessonId });
    }
  }, [lessons, checkConflict, students, pushTx]);

  const handleEnrollStudent = useCallback((studentData: StudentEnrollmentData) => {
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      studentIdNumber: getNewStudentIdNumber(),
      name: studentData.name,
      instrument: studentData.instrument,
      instructorId: studentData.instructorId,
      sessionsAttended: 0,
      sessionsBilled: 0,
      nickname: studentData.nickname,
      birthdate: studentData.birthdate,
      age: studentData.age,
      email: studentData.email,
      contactNumber: studentData.contactNumber,
      facebook: studentData.facebook,
      gender: studentData.gender,
      address: studentData.address,
      guardianFullName: studentData.guardianFullName,
      guardianRelationship: studentData.guardianRelationship,
      guardianPhone: studentData.guardianPhone,
      guardianEmail: studentData.guardianEmail,
      guardianFacebook: studentData.guardianFacebook,
      secondaryGuardian: studentData.secondaryGuardian,
      status: 'active',
      profilePictureUrl: generateAvatarUrl(studentData.name),
      parentStudentId: studentData.parentStudentId,
    };
    setStudents(prev => [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name)));
  }, [getNewStudentIdNumber]);

  const handleBulkEnrollStudents = useCallback(async (studentsData: Partial<Student>[]) => {
    const newStudents: Student[] = studentsData.map(studentData => ({
      id: `student-${Date.now()}-${Math.random()}`,
      studentIdNumber: getNewStudentIdNumber(),
      name: studentData.name || '',
      instrument: studentData.instrument || '',
      instructorId: studentData.instructorId || '',
      sessionsAttended: 0,
      sessionsBilled: 0,
      nickname: studentData.nickname,
      birthdate: studentData.birthdate,
      age: studentData.age,
      email: studentData.email,
      contactNumber: studentData.contactNumber,
      facebook: studentData.facebook,
      gender: studentData.gender || 'Male',
      address: studentData.address,
      guardianFullName: studentData.guardianFullName,
      guardianRelationship: studentData.guardianRelationship,
      guardianOccupation: studentData.guardianOccupation,
      guardianPhone: studentData.guardianPhone,
      guardianEmail: studentData.guardianEmail,
      guardianFacebook: studentData.guardianFacebook,
      secondaryGuardian: studentData.secondaryGuardian,
      status: 'active',
      profilePictureUrl: generateAvatarUrl(studentData.name || 'Student'),
      parentStudentId: studentData.parentStudentId,
      creditBalance: 0,
    }));
    
    setStudents(prev => [...prev, ...newStudents].sort((a, b) => a.name.localeCompare(b.name)));
    pushTx('student.enroll', 'success', `${newStudents.length} students enrolled successfully`, { count: newStudents.length });
  }, [getNewStudentIdNumber, pushTx]);

  const handleToggleStudentStatus = useCallback((studentId: string) => {
    setStudents(prevStudents => prevStudents.map(student => (student.id === studentId ? { ...student, status: student.status === 'active' ? 'inactive' : 'active' } : student)));
    const s = students.find(st => st.id === studentId);
    if (s) pushTx('student.status', 'success', `Student ${s.status === 'active' ? 'deactivated' : 'activated'}`, { studentId });
  }, [students, pushTx]);

  const handleOpenEditSessionModal = useCallback((student: Student) => {
    setEditingStudent(student);
    setIsEditSessionModalOpen(true);
  }, []);

  const handleCloseEditSessionModal = useCallback(() => {
    setEditingStudent(null);
    setIsEditSessionModalOpen(false);
  }, []);

  const handleUpdateStudentSessions = useCallback((studentId: string, unpaidCount: number) => {
    setStudents(prevStudents => prevStudents.map(student => (student.id === studentId ? { ...student, sessionsAttended: student.sessionsBilled + unpaidCount } : student)));
    handleCloseEditSessionModal();
  pushTx('student.status', 'success', 'Sessions updated', { studentId, unpaidCount });
  }, [handleCloseEditSessionModal, pushTx]);

  // Add: handler to update student's contact/guardian details
  const handleUpdateStudentContact = useCallback((studentId: string, updates: {
    email?: string;
    contactNumber?: string;
    facebook?: string;
    guardianFullName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianFacebook?: string;
  }) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));
    pushTx('student.contact.update', 'success', 'Student contact updated', { studentId });
  }, [pushTx]);

  const handleOpenEditInstructorModal = useCallback((instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsEditInstructorModalOpen(true);
  }, []);

  const handleOpenAddInstructorModal = useCallback(() => {
    setEditingInstructor(null);
    setIsAddInstructorMode(true);
    setIsEditInstructorModalOpen(true);
  }, []);

  const handleCloseEditInstructorModal = useCallback(() => {
    setEditingInstructor(null);
    setIsEditInstructorModalOpen(false);
    setIsAddInstructorMode(false);
  }, []);

  const handleSaveInstructor = useCallback((instructorData: Instructor) => {
    try {
      if (isAddInstructorMode) {
        const newInstructor: Instructor = { ...instructorData, id: `inst-${Date.now()}`, status: 'active' };
        setInstructors(prev => [...prev, newInstructor].sort((a, b) => a.name.localeCompare(b.name)));
        pushTx('instructor.save', 'success', `Instructor "${instructorData.name}" has been successfully added!`, { instructorId: newInstructor.id });
      } else {
        setInstructors(prevInstructors => prevInstructors.map(inst => (inst.id === instructorData.id ? instructorData : inst)));
        pushTx('instructor.save', 'success', `Instructor "${instructorData.name}" has been successfully updated!`, { instructorId: instructorData.id });
      }
      handleCloseEditInstructorModal();
    } catch (error) {
      const action = isAddInstructorMode ? 'add' : 'update';
      pushTx('instructor.save', 'error', `Failed to ${action} instructor. Please try again.`, { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [isAddInstructorMode, handleCloseEditInstructorModal, pushTx]);

  const handleRequestAdminAction = useCallback((action: AdminAction) => {
    setAdminActionToConfirm(action);
    setIsAdminAuthModalOpen(true);
  }, []);

  const handleAdminAuthSuccess = useCallback(async () => {
    setIsAdminAuthModalOpen(false);
    if (!adminActionToConfirm) return;
    switch (adminActionToConfirm.type) {
      case 'addInstructor':
        handleOpenAddInstructorModal();
        break;
      case 'toggleInstructorStatus': {
        const { instructorId } = adminActionToConfirm;
    setInstructors(prevInstructors => prevInstructors.map(inst => (inst.id === instructorId ? { ...inst, status: inst.status === 'active' ? 'inactive' : 'active' } : inst)));
    const inst = instructors.find(i => i.id === instructorId);
    if (inst) pushTx('instructor.status', 'success', `Instructor ${inst.status === 'active' ? 'deactivated' : 'activated'}`, { instructorId });
        break;
      }
      case 'deleteLessonPermanently': {
        setLessons(prev => prev.filter(l => l.id !== adminActionToConfirm.lessonId));
    pushTx('lesson.delete', 'success', 'Lesson permanently deleted', { lessonId: adminActionToConfirm.lessonId });
        break;
      }
      case 'enrollStudent': {
        const { studentData } = adminActionToConfirm;
        handleEnrollStudent(studentData);
        setEnrollmentSuccessMessage(`Student "${studentData.name.trim()}" has been successfully enrolled!`);
        // Note: Navigation to students page should be handled by the enrollment page component
        // Let page banners still work if any component uses the message
        setTimeout(() => setEnrollmentSuccessMessage(null), 5000);
        pushTx('student.enroll', 'success', `Enrolled ${studentData.name} in ${studentData.instrument}`);
        break;
      }
      case 'resetData':
    await initializeAppData();
    pushTx('app.reset', 'success', 'Application data reset');
        break;
    }
    setAdminActionToConfirm(null);
  }, [adminActionToConfirm, handleOpenAddInstructorModal, handleEnrollStudent, initializeAppData, instructors, pushTx]);

  const handleCloseAdminAuthModal = useCallback(() => {
    setIsAdminAuthModalOpen(false);
  }, []);

  const handleToggleInstructorStatus = useCallback((instructorId: string) => {
    handleRequestAdminAction({ type: 'toggleInstructorStatus', instructorId });
  }, [handleRequestAdminAction]);

  const handleRequestEnrollment = useCallback((studentData: StudentEnrollmentData) => {
    handleRequestAdminAction({ type: 'enrollStudent', studentData });
  }, [handleRequestAdminAction]);

  const handleRequestResetData = useCallback(() => {
    handleRequestAdminAction({ type: 'resetData' });
  }, [handleRequestAdminAction]);

  const handleRestoreLesson = useCallback((lessonId: string) => {
    const lessonToRestore = lessons.find(l => l.id === lessonId);
    if (!lessonToRestore) return;
    const conflict = checkConflict(lessonToRestore, lessonId);
    if (conflict) {
      toast.error(`Could not restore lesson: ${conflict}`);
      pushTx('lesson.restore', 'error', conflict, { lessonId });
      return;
    }
    setLessons(prev => prev.map(l => (l.id === lessonId ? { ...l, status: 'scheduled' } : l)));
    pushTx('lesson.restore', 'success', 'Lesson restored', { lessonId });
  }, [lessons, pushTx, checkConflict]);

  const getAdminActionDescription = () => {
    if (!adminActionToConfirm) return '';
    switch (adminActionToConfirm.type) {
      case 'addInstructor':
        return 'add a new instructor';
      case 'toggleInstructorStatus': {
        const instructor = instructors.find(i => i.id === adminActionToConfirm.instructorId);
        if (!instructor) return '';
        const nextAction = instructor.status === 'active' ? 'deactivate' : 'activate';
        return `${nextAction} instructor "${instructor.name || ''}"`;
      }
      case 'deleteLessonPermanently': {
        const lesson = lessons.find(l => l.id === adminActionToConfirm.lessonId);
        if (!lesson) return '';
        const student = students.find(s => s.id === lesson.studentId);
        return `permanently delete lesson for ${student?.name || 'Unknown'} on ${lesson.date}`;
      }
      case 'enrollStudent':
        return `enroll new student "${adminActionToConfirm.studentData.name}"`;
      case 'resetData':
        return 'reset all application data to its default state. This action is irreversible';
    }
  };

  const activeLessons = useMemo(() => lessons.filter(l => l.status === 'scheduled'), [lessons]);
  const deletedLessons = useMemo(() => lessons.filter(l => l.status === 'deleted'), [lessons]);

  const handleLessonDragStart = (e: React.DragEvent, lesson: Lesson) => {
    e.dataTransfer.setData('lessonId', lesson.id);
    e.dataTransfer.effectAllowed = e.altKey ? 'copy' : 'move';
    setIsDragging(true);
  };
  const handleLessonDragEnd = () => setIsDragging(false);
  const handleDropOnTrash = (lessonId: string) => {
    handleMoveLessonToTrash(lessonId);
    setIsDragging(false);
  };

  const timeSlots = TIME_SLOTS;

  const value: AppState = {
    view, setView,
    isLoading, error,
    students, instructors, lessons, billings,
    currentDate, setCurrentDate,
    calendarView, setCalendarView,
  theme, fontSize, handleThemeToggle, setThemeMode, handleFontSizeChange,
    activeLessons, deletedLessons, activeInstructors,
    initializeAppData,
    handleNavigate, handleDateSelect,
    handleOpenEditModal, handleOpenAddModal, handleCloseEditModal,
    isEditModalOpen, editingLesson, isAddMode,
    handleUpdateLesson, handleMoveLessonToTrash, handleUpdateLessonPosition,
    handleLessonDragStart, handleLessonDragEnd,
  handleMarkAttendance, handleRecordPayment,
  handleToggleStudentStatus,
    isEditSessionModalOpen, editingStudent, handleOpenEditSessionModal, handleCloseEditSessionModal, handleUpdateStudentSessions,
    isEditInstructorModalOpen, editingInstructor, isAddInstructorMode, handleOpenEditInstructorModal, handleOpenAddInstructorModal, handleCloseEditInstructorModal, handleSaveInstructor,
  isAdminAuthModalOpen, adminActionToConfirm, getAdminActionDescription, handleRequestAdminAction, handleAdminAuthSuccess, handleCloseAdminAuthModal,
  handleToggleInstructorStatus, handleRequestEnrollment, handleRequestResetData, handleRestoreLesson,
  // expose new handler
  handleUpdateBilling,
  handleUpdateStudentContact,
  handleBulkEnrollStudents,
  enrollmentSuccessMessage, installPromptEvent, handleInstallRequest,
  isDragging, handleDropOnTrash,
    timeSlots,
  transactions,
  };

  return (
    <AppContext.Provider value={value}>
      <div onDragEnd={handleLessonDragEnd}>{children}</div>
      {/* Trash zone stays at root so it can catch drags globally */}
      {/* Consumers can render TrashZone themselves; keeping logic here if needed */}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
