// =============================================
// TEACHER AUTHENTICATION HOOK
// Manages authentication state for teacher mobile app
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { authService, type AuthState, type TeacherProfile } from '../services/authService';
import type { User, AuthError } from '@supabase/supabase-js';

export interface UseTeacherAuthReturn {
  // Auth State
  user: User | null;
  profile: TeacherProfile | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth Actions
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<{
    full_name: string;
    avatar_url: string;
    phone: string;
    bio: string;
  }>) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<{ error: AuthError | null }>;
  
  // Utility Methods
  clearError: () => void;
  canAccessTeacherFeatures: () => boolean;
  getAccessToken: () => string | null;
  isSessionExpired: () => boolean;
}

export function useTeacherAuth(): UseTeacherAuthReturn {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signInWithEmail(email, password);
    return { error: result.error };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    return await authService.signOut();
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    return await authService.resetPassword(email);
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    return await authService.updatePassword(newPassword);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<{
    full_name: string;
    avatar_url: string;
    phone: string;
    bio: string;
  }>) => {
    return await authService.updateProfile(updates);
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    return await authService.refreshSession();
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    authService.clearError();
  }, []);

  // Check if user can access teacher features
  const canAccessTeacherFeatures = useCallback(() => {
    return authService.canAccessTeacherFeatures();
  }, []);

  // Get access token
  const getAccessToken = useCallback(() => {
    return authService.getAccessToken();
  }, []);

  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    return authService.isSessionExpired();
  }, []);

  return {
    // Auth State
    user: authState.user,
    profile: authState.profile,
    session: authState.session,
    isAuthenticated: authService.isAuthenticated(),
    isLoading: authState.loading,
    error: authState.error,
    
    // Auth Actions
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    
    // Utility Methods
    clearError,
    canAccessTeacherFeatures,
    getAccessToken,
    isSessionExpired
  };
}
