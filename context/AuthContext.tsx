import React, { createContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../utils/supabaseClient';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only initialize auth if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - running in development mode without authentication');
      setLoading(false);
      return;
    }

    let mounted = true;
    const supabase = getSupabaseClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Only show toast for explicit user actions, not automatic events
        if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out!');
        } else if (event === 'PASSWORD_RECOVERY') {
          toast.success('Password recovery email sent!');
        }
        // Don't show toast for SIGNED_IN, TOKEN_REFRESHED, or INITIAL_SESSION
        // These happen automatically and would spam the user
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication not available - Supabase not configured');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Sign in failed: ${error.message}`);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      const error = err as AuthError;
      toast.error(`Sign in failed: ${error.message}`);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication not available - Supabase not configured');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(`Sign up failed: ${error.message}`);
        return { user: null, error };
      }

      if (data.user && !data.session) {
        toast.success('Check your email for the confirmation link!');
      }

      return { user: data.user, error: null };
    } catch (err) {
      const error = err as AuthError;
      toast.error(`Sign up failed: ${error.message}`);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(`Sign out failed: ${error.message}`);
        throw error;
      }
    } catch (err) {
      const error = err as AuthError;
      toast.error(`Sign out failed: ${error.message}`);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication not available - Supabase not configured');
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(`Password reset failed: ${error.message}`);
        return { error };
      }

      toast.success('Password reset email sent!');
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      toast.error(`Password reset failed: ${error.message}`);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUp,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
