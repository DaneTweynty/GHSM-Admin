import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { ADMIN_PASSWORD } from '../constants';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionDescription: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess, actionDescription }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setError(null);
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const inputClasses = "w-full bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-2 text-text-primary dark:text-slate-100 focus:ring-brand-primary dark:focus:ring-brand-secondary focus:border-brand-primary dark:focus:border-brand-secondary";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="admin-auth-title">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm">
        <Card>
          <form onSubmit={handlePasswordSubmit}>
            <div className="p-6">
              <h2 id="admin-auth-title" className="text-xl font-bold text-text-primary dark:text-slate-100 mb-2">Admin Authorization</h2>
              <p className="text-text-secondary dark:text-slate-400 mb-6">Password required to {actionDescription}.</p>
              
              {error && <div className="bg-status-red-light dark:bg-status-red/20 border border-status-red/20 text-status-red px-4 py-3 rounded-md mb-4 font-medium" role="alert">{error}</div>}

              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Admin Password</label>
                <input
                  type="password"
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  required
                  autoFocus
                />
              </div>
            </div>
             <div className="bg-surface-header dark:bg-slate-700/50 p-4 flex justify-end space-x-3 rounded-b-lg border-t border-surface-border dark:border-slate-700">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md font-semibold text-text-secondary dark:text-slate-300 bg-surface-input dark:bg-slate-600 hover:brightness-95 dark:hover:bg-slate-500 transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md font-semibold text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity">
                  Authorize
                </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};