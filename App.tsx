
import React, { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TrashZone } from './components/TrashZone';
import ErrorBoundary from './components/ErrorBoundary';
import { CardSkeleton } from './components/LoadingSkeletons';

// Lazy-load pages for route-level code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EnrollmentPageWrapper = lazy(() => import('./pages/EnrollmentPageWrapper').then(m => ({ default: m.EnrollmentPageWrapper })));
const TeachersPage = lazy(() => import('./pages/TeachersPage').then(m => ({ default: m.TeachersPage })));
const StudentsPage = lazy(() => import('./pages/StudentsPage').then(m => ({ default: m.StudentsPage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const TrashPageWrapper = lazy(() => import('./pages/TrashPageWrapper').then(m => ({ default: m.TrashPageWrapper })));

// Lazy-load modals to keep them out of the main bundle until opened
const EditLessonModal = lazy(() => import('./components/EditLessonModal').then(m => ({ default: m.EditLessonModal })));
const EditSessionModal = lazy(() => import('./components/EditSessionModal').then(m => ({ default: m.EditSessionModal })));
const EditInstructorModal = lazy(() => import('./components/EditInstructorModal').then(m => ({ default: m.EditInstructorModal })));
const AdminAuthModal = lazy(() => import('./components/AdminAuthModal').then(m => ({ default: m.AdminAuthModal })));

const AppShell: React.FC = () => {
  const {
    view, setView,
    isLoading, error,
  theme, fontSize, handleThemeToggle, setThemeMode, handleFontSizeChange,
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
      case 'chat':
        return null; // Chat is handled separately
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-main dark:bg-slate-900 text-text-primary dark:text-slate-200 font-sans flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#fff' },
          success: { style: { background: '#16a34a' } },
          error: { style: { background: '#dc2626' } },
        }}
      />
      <Header
        currentView={view}
        setView={setView}
        theme={theme}
        onToggleTheme={handleThemeToggle}
        setThemeMode={setThemeMode}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        onRequestResetData={handleRequestResetData}
        installPromptEvent={installPromptEvent}
  onInstallRequest={handleInstallRequest}
      />
      {view === 'chat' ? (
        // Chat page takes full remaining height (viewport height minus header)
        <div className="h-[calc(100vh-4rem)]">
          <Suspense fallback={
            <div className="flex justify-center items-center h-96">
              <CardSkeleton lines={4} />
            </div>
          }>
            <ChatPage instructors={activeInstructors} />
          </Suspense>
        </div>
      ) : (
        // Other pages use full width with responsive padding
        <main className="p-4 sm:p-6 lg:p-8 w-full">
          <Suspense fallback={
            <div className="grid gap-6">
              <CardSkeleton lines={3} />
              <CardSkeleton lines={5} />
            </div>
          }>
            {renderContent()}
          </Suspense>
        </main>
      )}
      <Suspense fallback={null}>
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
      </Suspense>
      <Suspense fallback={null}>
      <EditSessionModal
        isOpen={isEditSessionModalOpen}
        onClose={handleCloseEditSessionModal}
        onSave={handleUpdateStudentSessions}
        student={editingStudent}
      />
      </Suspense>
      <Suspense fallback={null}>
      <EditInstructorModal
        isOpen={isEditInstructorModalOpen}
        onClose={handleCloseEditInstructorModal}
        onSave={handleSaveInstructor}
        instructor={editingInstructor}
        isAddMode={isAddInstructorMode}
      />
      </Suspense>
      <Suspense fallback={null}>
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={handleCloseAdminAuthModal}
        onSuccess={handleAdminAuthSuccess}
        actionDescription={getAdminActionDescription() || ''}
      />
      </Suspense>
      <TrashZone isVisible={isDragging} onDropLesson={handleDropOnTrash} />
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppProvider>
      <AppShell />
    </AppProvider>
  </ErrorBoundary>
);

export default App;