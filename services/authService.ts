// =============================================
// TEACHER AUTHENTICATION SERVICE
// Handles authentication for teacher mobile app
// =============================================
// @ts-nocheck

import { supabase } from '../utils/supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface TeacherProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  employee_id?: string;
  specialties: string[];
  hourly_rate?: number;
  bio?: string;
  status: string;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: TeacherProfile | null;
  loading: boolean;
  error: string | null;
}

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null
  };
  private listeners: Array<(state: AuthState) => void> = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.updateAuthState({ error: error.message, loading: false });
        return;
      }

      if (session?.user) {
        await this.setUserSession(session);
      } else {
        this.updateAuthState({ loading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          await this.setUserSession(session);
        } else {
          this.updateAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateAuthState({
        error: 'Failed to initialize authentication',
        loading: false
      });
    }
  }

  private async setUserSession(session: Session) {
    try {
      this.updateAuthState({ loading: true, error: null });

      // Get teacher profile
      const profile = await this.fetchTeacherProfile(session.user.id);
      
      if (!profile) {
        throw new Error('Teacher profile not found. Access denied.');
      }

      // Update last login
      await this.updateLastLogin(session.user.id);

      this.updateAuthState({
        user: session.user,
        session,
        profile,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Session setup error:', error);
      this.updateAuthState({
        error: error instanceof Error ? error.message : 'Authentication failed',
        loading: false
      });
    }
  }

  private updateAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // =============================================
  // PUBLIC METHODS
  // =============================================

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async signInWithEmail(email: string, password: string): Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }> {
    try {
      this.updateAuthState({ loading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.updateAuthState({ error: error.message, loading: false });
        return { user: null, session: null, error };
      }

      // Profile will be loaded automatically by auth state change listener
      return { ...data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      this.updateAuthState({ error: errorMessage, loading: false });
      return { user: null, session: null, error: error as AuthError };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      this.updateAuthState({ loading: true, error: null });

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        this.updateAuthState({ error: error.message, loading: false });
        return { error };
      }

      // State will be cleared automatically by auth state change listener
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      this.updateAuthState({ error: errorMessage, loading: false });
      return { error: error as AuthError };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  async updateProfile(updates: Partial<{
    full_name: string;
    avatar_url: string;
    phone: string;
    bio: string;
  }>): Promise<{ error: Error | null }> {
    try {
      if (!this.authState.user) {
        throw new Error('No authenticated user');
      }

      // Update user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          phone: updates.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.authState.user.id);

      if (profileError) throw profileError;

      // Update instructors table if bio is provided
      if (updates.bio !== undefined) {
        const { error: instructorError } = await supabase
          .from('instructors')
          .update({
            bio: updates.bio,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.authState.user.id);

        if (instructorError) throw instructorError;
      }

      // Refresh profile
      const updatedProfile = await this.fetchTeacherProfile(this.authState.user.id);
      if (updatedProfile) {
        this.updateAuthState({ profile: updatedProfile });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  private async fetchTeacherProfile(userId: string): Promise<TeacherProfile | null> {
    try {
      const { data, error } = await supabase.rpc('get_instructor_profile', {
        instructor_uuid: userId
      });

      if (error) throw error;
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Failed to fetch teacher profile:', error);
      return null;
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase.rpc('update_instructor_last_login', {
        instructor_uuid: userId
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
      // Don't throw - this is not critical
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  isAuthenticated(): boolean {
    return !!(this.authState.user && this.authState.profile);
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  getCurrentProfile(): TeacherProfile | null {
    return this.authState.profile;
  }

  getAccessToken(): string | null {
    return this.authState.session?.access_token || null;
  }

  isLoading(): boolean {
    return this.authState.loading;
  }

  getError(): string | null {
    return this.authState.error;
  }

  clearError(): void {
    this.updateAuthState({ error: null });
  }

  // =============================================
  // SESSION MANAGEMENT
  // =============================================

  async refreshSession(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.refreshSession();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  getSessionExpiry(): Date | null {
    if (!this.authState.session?.expires_at) return null;
    return new Date(this.authState.session.expires_at * 1000);
  }

  isSessionExpired(): boolean {
    const expiry = this.getSessionExpiry();
    if (!expiry) return false;
    return expiry.getTime() <= Date.now();
  }

  // =============================================
  // ROLE AND PERMISSION CHECKS
  // =============================================

  hasRole(role: string): boolean {
    return this.authState.profile?.status === 'active' && 
           this.authState.user !== null;
  }

  canAccessTeacherFeatures(): boolean {
    return this.isAuthenticated() && 
           this.authState.profile?.is_active === true &&
           this.authState.profile?.status === 'active';
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
