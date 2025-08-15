import React, { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext.supabase';
import { AuthProvider } from './context/AuthContext';
import { QueryProvider } from './context/QueryProvider';
import { AppRouter } from './router/AppRouter';
import { RouterHeader } from './components/RouterHeader';
import { TrashZone } from './components/TrashZone';
import { AuthGuard } from './components/AuthGuard';
import ErrorBoundary from './components/ErrorBoundary';
import { useRealtimeSubscriptions } from './hooks/useRealtime';

// Lazy-load modals to keep them out of the main bundle until opened
const EditLessonModal = lazy(() => import('./components/EditLessonModal').then(m => ({ default: m.EditLessonModal })));
const EditSessionModal = lazy(() => import('./components/EditSessionModal').then(m => ({ default: m.EditSessionModal })));
const EditInstructorModal = lazy(() => import('./components/EditInstructorModal').then(m => ({ default: m.EditInstructorModal })));
const AdminAuthModal = lazy(() => import('./components/AdminAuthModal').then(m => ({ default: m.AdminAuthModal })));

const AppShell: React.FC = () => {
  const {
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

  // Enable realtime subscriptions for Supabase updates
  useRealtimeSubscriptions();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-main dark:bg-slate-900 text-text-primary dark:text-slate-200 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-main dark:bg-slate-900 text-text-primary dark:text-slate-200 font-sans flex items-center justify-center">
        <div className="text-center text-status-red p-8">
          <h1 className="text-xl font-bold mb-4">Application Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-main dark:bg-slate-900 text-text-primary dark:text-slate-200 font-sans flex flex-col">
      {/* Skip Links for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <a
        href="#primary-nav"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to navigation
      </a>
      
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#fff' },
          success: { style: { background: '#16a34a' } },
          error: { style: { background: '#dc2626' } },
        }}
      />
      
      <RouterHeader
        theme={theme}
        onToggleTheme={handleThemeToggle}
        setThemeMode={(mode: 'auto' | 'light' | 'dark') => {
          // Map the RouterHeader theme modes to AppContext theme modes
          const mappedMode = mode === 'auto' ? 'system' : mode;
          setThemeMode(mappedMode);
        }}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        onRequestResetData={handleRequestResetData}
        installPromptEvent={installPromptEvent || undefined}
        onInstallRequest={handleInstallRequest}
      />
      
      {/* Router handles all page routing and layout */}
      <AppRouter />
      
      {/* Global Modals */}
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
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthGuard>
            <AppProvider>
              <AppShell />
            </AppProvider>
          </AuthGuard>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </ErrorBoundary>
);

export default App;
