import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ADMIN_PASSWORD } from '../constants';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionDescription: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
      toast.success('Authentication successful!');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      toast.error('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-surface-card dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-2xl font-bold mb-2 text-text-primary dark:text-slate-200">Admin Authentication</h2>
          <p className="text-text-secondary dark:text-slate-400">Please enter the admin password to continue</p>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
          </form>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex-shrink-0 pt-4">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary dark:text-slate-400 bg-surface-card dark:bg-slate-700 hover:bg-surface-hover dark:hover:bg-slate-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handlePasswordSubmit}
              className="px-4 py-2 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-md transition-colors"
            >
              Authenticate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};