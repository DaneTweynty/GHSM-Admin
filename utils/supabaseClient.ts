import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let supabaseClient: SupabaseClient<Database> | null = null;

// Utility function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return !!(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_project_url_here' &&
    supabaseAnonKey !== 'your_supabase_anon_key_here'
  );
};

// Get configured Supabase client or throw with clear message
export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set with valid values.'
    );
  }

  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'ghsm-admin@1.0.0',
        },
      },
    });
  }

  return supabaseClient;
};

// Legacy export for backward compatibility - will throw if not configured
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient<Database>];
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message as string;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred with the database connection';
};
