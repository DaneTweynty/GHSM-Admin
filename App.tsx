


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateSchedules } from './services/scheduleService';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { StudentsList } from './components/StudentsList';
import { TeachersList } from './components/TeachersList';
import { BillingList } from './components/BillingList';
import { EnrollmentPage } from './components/EnrollmentPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { EditLessonModal } from './components/EditLessonModal';
import { EditSessionModal } from './components/EditSessionModal';
import { EditInstructorModal } from './components/EditInstructorModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { TrashZone } from './components/TrashZone';
import { TrashPage } from './components/TrashPage';
import type { Student, Instructor, Lesson, Billing, View, CalendarView } from './types';
import { BILLING_CYCLE, LESSON_PRICE, EVENT_COLORS, TIME_SLOTS, toYYYYMMDD, LUNCH_BREAK_TIME } from './constants';

type StudentEnrollmentData = {
    name: string;
    instrument: string;
    instructorId: string;
    age: number;
    email: string;
    contactNumber: string;
    gender: 'Male' | 'Female';
    guardianName?: string;
};

type AdminAction = 
  | { type: 'addInstructor' }
  | { type: 'toggleInstructorStatus', instructorId: string }
  | { type: 'deleteLessonPermanently', lessonId: string }
  | { type: 'enrollStudent', studentData: StudentEnrollmentData }
  | { type: 'resetData' };

type FontSize = 'sm' | 'base' | 'lg';

const App: React.FC = () => {
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
    if (storedSize === 'sm' || storedSize === 'base' || storedSize === 'lg') {
        return storedSize;
    }
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

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallRequest = () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPromptEvent(null);
    });
  };
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'sm') {
        root.style.fontSize = '87.5%';
    } else if (fontSize === 'lg') {
        root.style.fontSize = '112.5%';
    } else { // 'base'
        root.style.fontSize = '100%';
    }
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
  };

  const getNewStudentIdNumber = useCallback(() => {
    const highestId = students.reduce((maxId, student) => {
        const currentId = parseInt(student.studentIdNumber, 10);
        // ensure we don't get NaN if an ID is malformed
        if (!isNaN(currentId) && currentId > maxId) {
            return currentId;
        }
        return maxId;
    }, 0);
    // If we have students, start from highest + 1, otherwise start from the base defined in gemini prompt.
    return (highestId > 0 ? highestId + 1 : 100001).toString();
  }, [students]);

  const initializeAppData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/initial-data.json');
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }
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
      setBillings([]); // Also reset billings on re-initialization

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
  
  // Effect to automatically generate invoices when a billing cycle is completed.
  useEffect(() => {
    const newBillings: Billing[] = [];
    
    students.forEach(student => {
      // Find the highest session number already covered by an existing invoice for this student
      const maxSessionsCoveredByInvoice = billings
        .filter(b => b.studentId === student.id)
        .reduce((max, b) => Math.max(max, b.sessionsCovered), 0);
        
      let sessionsPendingInvoice = student.sessionsAttended - maxSessionsCoveredByInvoice;
      let nextSessionToCover = maxSessionsCoveredByInvoice;

      // Keep generating invoices as long as there are full cycles to bill
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

    if (newBillings.length > 0) {
      setBillings(prevBillings => [...prevBillings, ...newBillings]);
    }
    
  }, [students, billings]);


  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (calendarView === 'year') {
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
      } else if (calendarView === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else if (calendarView === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else { // 'day'
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      }
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
      const studentIndex = newStudents.findIndex(s => s.id === studentId);
      if (studentIndex === -1) return prevStudents;

      const student = { ...newStudents[studentIndex] };

      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (student.lastAttendanceMarkedAt && (now - student.lastAttendanceMarkedAt < twentyFourHours)) {
          // This check is a safeguard; the button should be disabled in the UI.
          return prevStudents;
      }
      
      student.sessionsAttended += 1;
      student.lastAttendanceMarkedAt = now;
      
      newStudents[studentIndex] = student;
      return newStudents;
    });
  }, []);
  
  const handleMarkAsPaid = useCallback((billingId: string) => {
    setBillings(prevBillings => {
        const newBillings = prevBillings.map(b => 
            b.id === billingId ? { ...b, status: 'paid' as const } : b
        );
        
        const updatedBilling = newBillings.find(b => b.id === billingId);
        if (!updatedBilling) return prevBillings;

        const studentId = updatedBilling.studentId;

        const paidBillsForStudent = newBillings.filter(b => b.studentId === studentId && b.status === 'paid');
        const totalSessionsBilled = paidBillsForStudent.length * BILLING_CYCLE;

        setStudents(prevStudents => 
            prevStudents.map(student => 
                student.id === studentId 
                    ? { ...student, sessionsBilled: totalSessionsBilled } 
                    : student
            )
        );

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
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status: 'deleted' } : l));
    handleCloseEditModal(); // Also close modal if it was open
  }, [handleCloseEditModal]);

  const handleUpdateLesson = useCallback((lessonData: Omit<Lesson, 'status'>) => {
    if (isAddMode) {
      const student = students.find(s => s.id === lessonData.studentId);
      if (student && student.status === 'inactive') {
        alert('This student is not currently enrolled. Please activate the student to schedule new lessons.');
        return;
      }
      
      const newLesson: Lesson = {
        ...lessonData,
        status: 'scheduled',
      };
      setLessons(prevLessons => [...prevLessons, newLesson]);

    } else { // If we were editing an existing lesson
      const updatedLesson: Lesson = {
        ...lessonData,
        status: 'scheduled',
      };
      setLessons(prevLessons =>
        prevLessons.map(l => l.id === updatedLesson.id ? updatedLesson : l)
      );
      // Update the student's primary instructor if it changed
      const originalLesson = lessons.find(l => l.id === updatedLesson.id);
      if (originalLesson && originalLesson.instructorId !== updatedLesson.instructorId) {
        setStudents(prevStudents =>
          prevStudents.map(s =>
            s.id === updatedLesson.studentId
              ? { ...s, instructorId: updatedLesson.instructorId }
              : s
          )
        );
      }
    }
    handleCloseEditModal();
  }, [lessons, isAddMode, handleCloseEditModal, students]);

  const checkConflict = useCallback((lessonToPlace: Omit<Lesson, 'id'>, ignoreLessonId?: string): string | null => {
        for (const l of lessons) {
            if (l.id === ignoreLessonId || l.status === 'deleted') continue;
            if (l.date === lessonToPlace.date && l.time === lessonToPlace.time) {
                if (l.instructorId === lessonToPlace.instructorId) {
                    const conflictingInstructor = instructors.find(i => i.id === l.instructorId);
                    return `Instructor ${conflictingInstructor?.name || ''} is already scheduled at this time.`;
                }
                if (l.roomId === lessonToPlace.roomId) {
                    return `Room ${l.roomId} is already booked at this time.`;
                }
                if (l.studentId === lessonToPlace.studentId) {
                     const conflictingStudent = students.find(s => s.id === l.studentId);
                    return `Student ${conflictingStudent?.name || ''} already has a lesson at this time.`;
                }
            }
        }
        return null;
  }, [lessons, instructors, students]);
  
  const handleUpdateLessonPosition = useCallback((lessonId: string, newDate: Date, newTime: string | undefined, isCopy: boolean) => {
    const originalLesson = lessons.find(l => l.id === lessonId);
    if (!originalLesson) return;

    const student = students.find(s => s.id === originalLesson.studentId);
    if (student && student.status === 'inactive') {
        alert(`Cannot schedule lessons for ${student.name} because they are not enrolled.`);
        return;
    }

    const newDateString = toYYYYMMDD(newDate);
    const targetTime = newTime || originalLesson.time;

    if (targetTime === LUNCH_BREAK_TIME) {
        alert(`Cannot schedule a lesson during the lunch break (${LUNCH_BREAK_TIME}).`);
        return;
    }

    const baseLessonData = {
        ...originalLesson,
        date: newDateString,
        time: targetTime,
    };

    if (isCopy) {
        const newLesson: Lesson = {
            ...baseLessonData,
            id: `lesson-${Date.now()}`,
            notes: `(Copied) ${originalLesson.notes || ''}`.trim(),
            status: 'scheduled',
        };
        const conflict = checkConflict(newLesson);
        if (conflict) {
            window.alert(`Could not copy lesson: ${conflict}`);
            return;
        }
        setLessons(prev => [...prev, newLesson]);
    } else { // Move
        const updatedLesson = { ...baseLessonData };
        const conflict = checkConflict(updatedLesson, originalLesson.id);
         if (conflict) {
            window.alert(`Could not move lesson: ${conflict}`);
            return;
        }
        setLessons(prev => prev.map(l => l.id === lessonId ? updatedLesson : l));
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
    setStudents(prev => [...prev, newStudent].sort((a,b) => a.name.localeCompare(b.name)));
  }, [getNewStudentIdNumber]);
  
  const handleToggleStudentStatus = useCallback((studentId: string) => {
    setStudents(prevStudents => 
        prevStudents.map(student => 
            student.id === studentId 
                ? { ...student, status: student.status === 'active' ? 'inactive' : 'active' } 
                : student
        )
    );
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
    setStudents(prevStudents => {
        return prevStudents.map(student => {
            if (student.id === studentId) {
                const newTotalAttendedSessions = student.sessionsBilled + unpaidCount;
                return { ...student, sessionsAttended: newTotalAttendedSessions };
            }
            return student;
        });
    });
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
      const newInstructor: Instructor = {
        ...instructorData,
        id: `inst-${Date.now()}`,
        status: 'active',
      };
      setInstructors(prev => [...prev, newInstructor].sort((a,b) => a.name.localeCompare(b.name)));
    } else {
      setInstructors(prevInstructors =>
        prevInstructors.map(inst =>
          inst.id === instructorData.id ? instructorData : inst
        )
      );
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
            setInstructors(prevInstructors =>
                prevInstructors.map(inst =>
                    inst.id === instructorId
                        ? { ...inst, status: inst.status === 'active' ? 'inactive' : 'active' }
                        : inst
                )
            );
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
        case 'resetData': {
            initializeAppData();
            break;
        }
    }
    setAdminActionToConfirm(null);
  }, [adminActionToConfirm, handleOpenAddInstructorModal, handleEnrollStudent, initializeAppData]);
  
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
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status: 'scheduled' } : l));
  }, [lessons, checkConflict]);

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
        case 'enrollStudent': {
            return `enroll new student "${adminActionToConfirm.studentData.name}"`;
        }
        case 'resetData':
            return 'reset all application data to its default state. This action is irreversible';
    }
  };

  const activeLessons = useMemo(() => lessons.filter(l => l.status === 'scheduled'), [lessons]);
  const deletedLessons = useMemo(() => lessons.filter(l => l.status === 'deleted'), [lessons]);

  const handleLessonDragStart = (e: React.DragEvent, lesson: Lesson) => {
    e.dataTransfer.setData('lessonId', lesson.id);
    e.dataTransfer.effectAllowed = e.altKey ? "copy" : "move";
    setIsDragging(true);
  };
  
  const handleLessonDragEnd = () => {
    setIsDragging(false);
  };
  
  const handleDropOnTrash = (lessonId: string) => {
    handleMoveLessonToTrash(lessonId);
    setIsDragging(false);
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
    }
    if (error) {
      return <div className="text-center text-status-red p-8">{error}</div>;
    }
    switch (view) {
      case 'dashboard':
        return <Dashboard 
                  lessons={activeLessons} 
                  students={students} 
                  instructors={instructors}
                  currentDate={currentDate}
                  view={calendarView}
                  setView={setCalendarView}
                  onNavigate={handleNavigate}
                  onEditLesson={handleOpenEditModal}
                  onAddLesson={handleOpenAddModal}
                  onDateSelect={handleDateSelect}
                  onUpdateLessonPosition={handleUpdateLessonPosition}
                  onLessonDragStart={handleLessonDragStart}
               />;
      case 'enrollment':
        return <EnrollmentPage 
                  instructors={activeInstructors} 
                  onRequestEnrollment={handleRequestEnrollment} 
                  successMessage={enrollmentSuccessMessage}
               />;
      case 'teachers':
        return <TeachersList 
                  instructors={instructors}
                  students={students}
                  lessons={activeLessons}
                  onMarkAttendance={handleMarkAttendance}
                  onEditInstructor={handleOpenEditInstructorModal}
                  onAddInstructor={() => handleRequestAdminAction({ type: 'addInstructor' })}
                  onToggleInstructorStatus={handleToggleInstructorStatus}
               />;
      case 'students':
        return <StudentsList 
                  students={students} 
                  instructors={instructors} 
                  lessons={activeLessons}
                  billings={billings}
                  onMarkAttendance={handleMarkAttendance} 
                  onToggleStatus={handleToggleStudentStatus}
                  onEditSessions={handleOpenEditSessionModal}
               />;
      case 'billing':
        return <BillingList students={students} billings={billings} onMarkAsPaid={handleMarkAsPaid} />;
      case 'trash':
        return <TrashPage 
                  deletedLessons={deletedLessons} 
                  students={students} 
                  instructors={instructors} 
                  onRestore={handleRestoreLesson} 
                  onDeletePermanently={(lessonId) => handleRequestAdminAction({ type: 'deleteLessonPermanently', lessonId })} 
                />
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-main dark:bg-slate-900 text-text-primary dark:text-slate-200 font-sans" onDragEnd={handleLessonDragEnd}>
      <Header 
        currentView={view} 
        setView={setView} 
        theme={theme}
        onToggleTheme={handleThemeToggle}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        onRequestResetData={handleRequestResetData}
        installPromptEvent={installPromptEvent}
        onInstallRequest={handleInstallRequest}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderContent()}
      </main>
      <EditLessonModal 
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateLesson}
        onMoveToTrash={handleMoveLessonToTrash}
        lesson={editingLesson}
        isAddMode={isAddMode}
        instructors={activeInstructors}
        students={students}
        allLessons={lessons}
        timeSlots={TIME_SLOTS}
      />
      <EditSessionModal
        isOpen={isEditSessionModalOpen}
        onClose={handleCloseEditSessionModal}
        onSave={handleUpdateStudentSessions}
        student={editingStudent}
      />
      <EditInstructorModal
        isOpen={isEditInstructorModalOpen}
        onClose={handleCloseEditInstructorModal}
        onSave={handleSaveInstructor}
        instructor={editingInstructor}
        isAddMode={isAddInstructorMode}
      />
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
        actionDescription={getAdminActionDescription() || ''}
      />
      <TrashZone isVisible={isDragging} onDropLesson={handleDropOnTrash} />
    </div>
  );
};

export default App;