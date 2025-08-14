import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CardSkeleton } from '../components/LoadingSkeletons';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { ChatPage } from '../pages/ChatPage';

// Lazy load pages for better performance
const DashboardPage = React.lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EnrollmentPageWrapper = React.lazy(() => import('../pages/EnrollmentPageWrapper').then(m => ({ default: m.EnrollmentPageWrapper })));
const TeachersPage = React.lazy(() => import('../pages/TeachersPage').then(m => ({ default: m.TeachersPage })));
const StudentsPage = React.lazy(() => import('../pages/StudentsPage').then(m => ({ default: m.StudentsPage })));
const BillingPage = React.lazy(() => import('../pages/BillingPage').then(m => ({ default: m.BillingPage })));
const TrashPageWrapper = React.lazy(() => import('../pages/TrashPageWrapper').then(m => ({ default: m.TrashPageWrapper })));

// Chat page component wrapper
const ChatPageWrapper: React.FC = () => {
  const { instructors } = useApp();
  return (
    <div className="h-[calc(100vh-4rem)]" id="main-content">
      <ChatPage instructors={instructors} />
    </div>
  );
};

// Placeholder components for missing pages
const TeacherDetailPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Detail</h1>
      <p className="text-gray-600">Teacher detail page implementation coming soon...</p>
    </div>
  );
};

const StudentDetailPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Student Detail</h1>
      <p className="text-gray-600">Student detail page implementation coming soon...</p>
    </div>
  );
};

const ChatConversationPage: React.FC = () => {
  const { instructors } = useApp();
  return (
    <div className="h-[calc(100vh-4rem)] p-6" id="main-content">
      <h1 className="text-2xl font-bold mb-4">Chat Conversation</h1>
      <p className="text-gray-600">Chat conversation page implementation coming soon...</p>
    </div>
  );
};

// Layout wrapper component
interface LayoutProps {
  children: React.ReactNode;
  fullHeight?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, fullHeight = false }) => {
  if (fullHeight) {
    return (
      <div className="h-[calc(100vh-4rem)]" id="main-content">
        {children}
      </div>
    );
  }
  
  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full" id="main-content">
      {children}
    </main>
  );
};

// Loading fallback component
const PageLoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-96">
    <CardSkeleton lines={4} />
  </div>
);

// Chat loading fallback (for full height layout)
const ChatLoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-96">
    <LoadingSpinner />
  </div>
);

// Route component with error boundary and loading
interface RouteWrapperProps {
  children: React.ReactNode;
  fullHeight?: boolean;
}

const RouteWrapper: React.FC<RouteWrapperProps> = ({ children, fullHeight = false }) => (
  <ErrorBoundary>
    <Layout fullHeight={fullHeight}>
      <Suspense fallback={fullHeight ? <ChatLoadingFallback /> : <PageLoadingFallback />}>
        {children}
      </Suspense>
    </Layout>
  </ErrorBoundary>
);

// Main router component
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Dashboard - Default route */}
      <Route 
        path={ROUTES.DASHBOARD} 
        element={
          <RouteWrapper>
            <DashboardPage />
          </RouteWrapper>
        } 
      />
      
      {/* Enrollment */}
      <Route 
        path={ROUTES.ENROLLMENT} 
        element={
          <RouteWrapper>
            <EnrollmentPageWrapper />
          </RouteWrapper>
        } 
      />
      
      {/* Teachers */}
      <Route 
        path={ROUTES.TEACHERS} 
        element={
          <RouteWrapper>
            <TeachersPage />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path={ROUTES.TEACHER_DETAIL} 
        element={
          <RouteWrapper>
            <TeacherDetailPage />
          </RouteWrapper>
        } 
      />
      
      {/* Students */}
      <Route 
        path={ROUTES.STUDENTS} 
        element={
          <RouteWrapper>
            <StudentsPage />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path={ROUTES.STUDENT_DETAIL} 
        element={
          <RouteWrapper>
            <StudentDetailPage />
          </RouteWrapper>
        } 
      />
      
      {/* Billing */}
      <Route 
        path={ROUTES.BILLING} 
        element={
          <RouteWrapper>
            <BillingPage />
          </RouteWrapper>
        } 
      />
      
      {/* Chat routes */}
      <Route 
        path={ROUTES.CHAT} 
        element={
          <ChatPageWrapper />
        } 
      />
      
      <Route 
        path={ROUTES.CHAT_CONVERSATION} 
        element={
          <ChatConversationPage />
        } 
      />
      
      {/* Trash */}
      <Route 
        path={ROUTES.TRASH} 
        element={
          <RouteWrapper>
            <TrashPageWrapper />
          </RouteWrapper>
        } 
      />
      
      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
};
