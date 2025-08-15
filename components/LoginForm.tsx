import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../utils/supabaseClient';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (!error) {
          onSuccess?.();
        }
      } else {
        const { error } = await signIn(email, password);
        if (!error) {
          onSuccess?.();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setLoading(true);
    try {
      await resetPassword(resetEmail);
      setShowResetPassword(false);
      setResetEmail('');
    } finally {
      setLoading(false);
    }
  };

  // Show development mode message if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-surface-card dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary dark:text-slate-200">
            Development Mode
          </h2>
          <p className="text-text-secondary dark:text-slate-400 mb-4">
            Authentication is disabled in development mode. Supabase is not configured.
          </p>
          <button
            onClick={onSuccess}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-text-on-color px-4 py-2 rounded-md transition-colors"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div className="bg-surface-card dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-text-primary dark:text-slate-200">
          Reset Password
        </h2>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-3 py-2 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-700 text-text-primary dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-text-on-color px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
            <button
              type="button"
              onClick={() => setShowResetPassword(false)}
              className="flex-1 bg-surface-secondary hover:bg-surface-secondary/90 text-text-primary dark:text-slate-200 px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-surface-card dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
      <h2 className="text-2xl font-bold mb-4 text-text-primary dark:text-slate-200">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-700 text-text-primary dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-surface-border dark:border-slate-600 rounded-md bg-surface-input dark:bg-slate-700 text-text-primary dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Enter your password"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-text-on-color px-4 py-2 rounded-md transition-colors"
        >
          {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>
      </form>
      
      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm text-brand-primary hover:text-brand-primary/80 transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
        
        {!isSignUp && (
          <button
            type="button"
            onClick={() => setShowResetPassword(true)}
            className="w-full text-sm text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
};
