import React, { useState, useEffect } from 'react';
import type { Student } from '../types';
import { Card } from './Card';
import { ADMIN_PASSWORD } from '../constants';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentId: string, newCount: number) => void;
  student: Student | null;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({ isOpen, onClose, onSave, student }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unpaidSessionCount, setUnpaidSessionCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setUnpaidSessionCount(student.sessionsAttended - student.sessionsBilled);
    }
    // Reset on open
    if (isOpen) {
        setIsAuthenticated(false);
        setPassword('');
        setError(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleSave = () => {
    // Pass the new unpaid count, App.tsx will handle the total calculation
    onSave(student.id, unpaidSessionCount);
  };

  const handleModalClose = () => {
    onClose();
  };
  
  const inputClasses = "w-full bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-2 text-text-primary dark:text-slate-100 focus:ring-brand-primary dark:focus:ring-brand-secondary focus:border-brand-primary dark:focus:border-brand-secondary";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={handleModalClose} role="dialog" aria-modal="true">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-2">Edit Unpaid Sessions</h2>
            <p className="text-text-secondary dark:text-slate-400 mb-6">For student: <span className="font-semibold text-brand-secondary">{student.name}</span></p>
            
            {error && <div className="bg-status-red-light dark:bg-status-red/20 border-status-red/20 text-status-red px-4 py-3 rounded-md mb-4 font-medium" role="alert">{error}</div>}

            {!isAuthenticated ? (
              <form onSubmit={handlePasswordSubmit}>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Admin Password Required</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  required
                  autoFocus
                />
                <button type="submit" className="mt-4 w-full px-4 py-2 rounded-md font-semibold text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity">
                  Authenticate
                </button>
              </form>
            ) : (
              <div>
                <label htmlFor="unpaidSessionCount" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Unpaid Session Count</label>
                <input
                  type="number"
                  id="unpaidSessionCount"
                  value={unpaidSessionCount}
                  onChange={(e) => setUnpaidSessionCount(parseInt(e.target.value, 10) || 0)}
                  min="0"
                  className={inputClasses}
                  autoFocus
                />
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={handleModalClose} className="px-4 py-2 rounded-md font-semibold text-text-secondary dark:text-slate-300 bg-surface-input dark:bg-slate-600 hover:brightness-95 dark:hover:bg-slate-500 transition-all">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 rounded-md font-semibold text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity">
                        Save Changes
                    </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};