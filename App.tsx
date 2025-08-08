
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { EditLessonModal } from './components/EditLessonModal';
import { EditSessionModal } from './components/EditSessionModal';
import { EditInstructorModal } from './components/EditInstructorModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { TrashZone } from './components/TrashZone';
import { DashboardPage } from './pages/DashboardPage';
import { EnrollmentPageWrapper } from './pages/EnrollmentPageWrapper';
import { TeachersPage } from './pages/TeachersPage';
import { StudentsPage } from './pages/StudentsPage';
import { BillingPage } from './pages/BillingPage';
import { TrashPageWrapper } from './pages/TrashPageWrapper';

const AppShell: React.FC = () => {
  const {
    view, setView,
    isLoading, error,
    theme, fontSize, handleThemeToggle, handleFontSizeChange,
  handleInstallRequest, installPromptEvent,
    handleRequestResetData,
  isEditModalOpen, editingLesson, isAddMode, handleCloseEditModal, handleUpdateLesson, handleMoveLessonToTrash,
    activeInstructors, students, lessons, timeSlots,
    isEditSessionModalOpen, editingStudent, handleCloseEditSessionModal, handleUpdateStudentSessions,
    isEditInstructorModalOpen, editingInstructor, isAddInstructorMode, handleCloseEditInstructorModal, handleSaveInstructor,
    isAdminAuthModalOpen, getAdminActionDescription, handleAdminAuthSuccess, handleCloseAdminAuthModal,
    isDragging, handleDropOnTrash,
  } = useApp();

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
    if (error) return <div className="text-center text-status-red p-8">{error}</div>;
    switch (view) {
      case 'dashboard':
        return <DashboardPage />;
      case 'enrollment':
        return <EnrollmentPageWrapper />;
      case 'teachers':
        return <TeachersPage />;
      case 'students':
        return <StudentsPage />;
      case 'billing':
        return <BillingPage />;
      case 'trash':
        return <TrashPageWrapper />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-main dark:bg-slate-900 text-text-primary dark:text-slate-200 font-sans">
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
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{renderContent()}</main>
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
        timeSlots={timeSlots}
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
        onClose={handleCloseAdminAuthModal}
        onSuccess={handleAdminAuthSuccess}
        actionDescription={getAdminActionDescription() || ''}
      />
      <TrashZone isVisible={isDragging} onDropLesson={handleDropOnTrash} />
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default App;