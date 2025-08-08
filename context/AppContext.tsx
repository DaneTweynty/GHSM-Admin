import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import type { Student, Instructor, Lesson, Billing, View, CalendarView } from '../types';
import { BILLING_CYCLE, LESSON_PRICE, EVENT_COLORS, TIME_SLOTS, toYYYYMMDD, LUNCH_BREAK_TIME } from '../constants';
import { addMinutes, floorToQuarter, roundToQuarter, rangesOverlap, toMinutes } from '../utils/time';
import { generateSchedules } from '../services/scheduleService';

export type StudentEnrollmentData = {
  name: string;
  instrument: string;
  instructorId: string;
  age: number;
  email: string;
  contactNumber: string;
  gender: 'Male' | 'Female';
  guardianName?: string;
};

export type AdminAction = 
  | { type: 'addInstructor' }
  | { type: 'toggleInstructorStatus', instructorId: string }
  | { type: 'deleteLessonPermanently', lessonId: string }
  | { type: 'enrollStudent', studentData: StudentEnrollmentData }
  | { type: 'resetData' };

export type FontSize = 'sm' | 'base' | 'lg';

export type AppState = {
  view: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
  isLoading: boolean;
  error: string | null;

  students: Student[];
  instructors: Instructor[];
  lessons: Lesson[];
  billings: Billing[];

  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  calendarView: CalendarView;
  setCalendarView: React.Dispatch<React.SetStateAction<CalendarView>>;

  theme: string;
  fontSize: FontSize;
  handleThemeToggle: () => void;
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
  handleMarkAsPaid: (billingId: string) => void;
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

  enrollmentSuccessMessage: string | null;
  installPromptEvent: (Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> }) | null;
  handleInstallRequest: () => void;

  isDragging: boolean;
  handleDropOnTrash: (lessonId: string) => void;

  timeSlots: typeof TIME_SLOTS;
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isEditInstructorModalOpen, setIsEditInstructorModalOpen] = useState<boolean>(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [isAddInstructorMode, setIsAddInstructorMode] = useState<boolean>(false);

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [adminActionToConfirm, setAdminActionToConfirm] = useState<AdminAction | null>(null);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const storedSize = localStorage.getItem('fontSize');
    if (storedSize === 'sm' || storedSize === 'base' || storedSize === 'lg') return storedSize;
    return 'base';
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [enrollmentSuccessMessage, setEnrollmentSuccessMessage] = useState<string | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

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

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = fontSize === 'sm' ? '87.5%' : fontSize === 'lg' ? '112.5%' : '100%';
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const handleThemeToggle = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      return newStudents;
    });
  }, []);

  const handleMarkAsPaid = useCallback((billingId: string) => {
    setBillings(prevBillings => {
      const newBillings = prevBillings.map(b => (b.id === billingId ? { ...b, status: 'paid' as const } : b));
      const updatedBilling = newBillings.find(b => b.id === billingId);
      if (!updatedBilling) return prevBillings;
      const studentId = updatedBilling.studentId;
      const paidBillsForStudent = newBillings.filter(b => b.studentId === studentId && b.status === 'paid');
      const totalSessionsBilled = paidBillsForStudent.length * BILLING_CYCLE;
      setStudents(prevStudents => prevStudents.map(s => (s.id === studentId ? { ...s, sessionsBilled: totalSessionsBilled } : s)));
      return newBillings;
    });
  }, []);

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
  }, [handleCloseEditModal]);

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
        alert('This student is not currently enrolled. Please activate the student to schedule new lessons.');
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
          const { id: _omit, ...repeatForCheck } = repeatLesson as any;
          const conflict = checkConflict(repeatForCheck, undefined);
          if (!conflict) lessonsToAdd.push(repeatLesson);
        }
      }
      setLessons(prevLessons => [...prevLessons, ...lessonsToAdd]);
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
          const { id: _omit, ...repeatForCheck } = repeatLesson as any;
          const conflict = checkConflict(repeatForCheck, undefined);
          if (!conflict) newOccurrences.push(repeatLesson);
        }
        if (newOccurrences.length) setLessons(prev => [...prev, ...newOccurrences]);
      }
    }
    handleCloseEditModal();
  }, [lessons, isAddMode, handleCloseEditModal, students, checkConflict]);

  const handleUpdateLessonPosition = useCallback((lessonId: string, newDate: Date, newTime: string | undefined, isCopy: boolean) => {
    const originalLesson = lessons.find(l => l.id === lessonId);
    if (!originalLesson) return;

    const student = students.find(s => s.id === originalLesson.studentId);
    if (student && student.status === 'inactive') {
      alert(`Cannot schedule lessons for ${student.name} because they are not enrolled.`);
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
      alert(`Cannot schedule a lesson overlapping the lunch break (${LUNCH_BREAK_TIME}).`);
      return;
    }

  const baseLessonData = { ...originalLesson, date: newDateString, time: targetTime, endTime: targetEnd };

    if (isCopy) {
      const newLesson: Lesson = { ...baseLessonData, id: `lesson-${Date.now()}`, notes: `(Copied) ${originalLesson.notes || ''}`.trim(), status: 'scheduled' };
      const conflict = checkConflict(newLesson);
      if (conflict) {
        window.alert(`Could not copy lesson: ${conflict}`);
        return;
      }
      setLessons(prev => [...prev, newLesson]);
    } else {
  const updatedLesson = { ...baseLessonData };
      const conflict = checkConflict(updatedLesson, originalLesson.id);
      if (conflict) {
        window.alert(`Could not move lesson: ${conflict}`);
        return;
      }
      setLessons(prev => prev.map(l => (l.id === lessonId ? updatedLesson : l)));
    }
  }, [lessons, checkConflict, students]);

  const handleEnrollStudent = useCallback((studentData: StudentEnrollmentData) => {
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      studentIdNumber: getNewStudentIdNumber(),
      name: studentData.name,
      instrument: studentData.instrument,
      instructorId: studentData.instructorId,
      sessionsAttended: 0,
      sessionsBilled: 0,
      age: studentData.age,
      email: studentData.email,
      contactNumber: studentData.contactNumber,
      gender: studentData.gender,
      guardianName: studentData.guardianName,
      status: 'active',
      profilePictureUrl: undefined,
    };
    setStudents(prev => [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name)));
  }, [getNewStudentIdNumber]);

  const handleToggleStudentStatus = useCallback((studentId: string) => {
    setStudents(prevStudents => prevStudents.map(student => (student.id === studentId ? { ...student, status: student.status === 'active' ? 'inactive' : 'active' } : student)));
  }, []);

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
  }, [handleCloseEditSessionModal]);

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
    if (isAddInstructorMode) {
      const newInstructor: Instructor = { ...instructorData, id: `inst-${Date.now()}`, status: 'active' };
      setInstructors(prev => [...prev, newInstructor].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setInstructors(prevInstructors => prevInstructors.map(inst => (inst.id === instructorData.id ? instructorData : inst)));
    }
    handleCloseEditInstructorModal();
  }, [isAddInstructorMode, handleCloseEditInstructorModal]);

  const handleRequestAdminAction = useCallback((action: AdminAction) => {
    setAdminActionToConfirm(action);
    setIsAdminAuthModalOpen(true);
  }, []);

  const handleAdminAuthSuccess = useCallback(() => {
    setIsAdminAuthModalOpen(false);
    if (!adminActionToConfirm) return;
    switch (adminActionToConfirm.type) {
      case 'addInstructor':
        handleOpenAddInstructorModal();
        break;
      case 'toggleInstructorStatus': {
        const { instructorId } = adminActionToConfirm;
        setInstructors(prevInstructors => prevInstructors.map(inst => (inst.id === instructorId ? { ...inst, status: inst.status === 'active' ? 'inactive' : 'active' } : inst)));
        break;
      }
      case 'deleteLessonPermanently': {
        setLessons(prev => prev.filter(l => l.id !== adminActionToConfirm.lessonId));
        break;
      }
      case 'enrollStudent': {
        const { studentData } = adminActionToConfirm;
        handleEnrollStudent(studentData);
        setEnrollmentSuccessMessage(`Student "${studentData.name.trim()}" has been successfully enrolled!`);
        setTimeout(() => setEnrollmentSuccessMessage(null), 5000);
        break;
      }
      case 'resetData':
        initializeAppData();
        break;
    }
    setAdminActionToConfirm(null);
  }, [adminActionToConfirm, handleOpenAddInstructorModal, handleEnrollStudent, initializeAppData]);

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
      alert(`Could not restore lesson: ${conflict}`);
      return;
    }
    setLessons(prev => prev.map(l => (l.id === lessonId ? { ...l, status: 'scheduled' } : l)));
  }, [lessons]);

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
    theme, fontSize, handleThemeToggle, handleFontSizeChange,
    activeLessons, deletedLessons, activeInstructors,
    initializeAppData,
    handleNavigate, handleDateSelect,
    handleOpenEditModal, handleOpenAddModal, handleCloseEditModal,
    isEditModalOpen, editingLesson, isAddMode,
    handleUpdateLesson, handleMoveLessonToTrash, handleUpdateLessonPosition,
    handleLessonDragStart, handleLessonDragEnd,
    handleMarkAttendance, handleMarkAsPaid,
  handleToggleStudentStatus,
    isEditSessionModalOpen, editingStudent, handleOpenEditSessionModal, handleCloseEditSessionModal, handleUpdateStudentSessions,
    isEditInstructorModalOpen, editingInstructor, isAddInstructorMode, handleOpenEditInstructorModal, handleOpenAddInstructorModal, handleCloseEditInstructorModal, handleSaveInstructor,
  isAdminAuthModalOpen, adminActionToConfirm, getAdminActionDescription, handleRequestAdminAction, handleAdminAuthSuccess, handleCloseAdminAuthModal,
  handleToggleInstructorStatus, handleRequestEnrollment, handleRequestResetData, handleRestoreLesson,
  enrollmentSuccessMessage, installPromptEvent, handleInstallRequest,
  isDragging, handleDropOnTrash,
    timeSlots,
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
