import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from './LoginForm';
import { LoadingSpinner } from './LoadingSpinner';
import { isSupabaseConfigured } from '../utils/supabaseClient';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { user, loading } = useAuth();

  // If Supabase is not configured, allow access (development mode)
  if (!isSupabaseConfigured()) {
    return <>{children}</>;
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary dark:bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-surface-primary dark:bg-slate-900 flex items-center justify-center">
        {fallback || <LoginForm />}
      </div>
    );
  }

  // User is authenticated, show protected content
  return <>{children}</>;
};
