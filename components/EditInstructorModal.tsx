

import React, { useState, useEffect } from 'react';
import type { Instructor } from '../types';
import { Card } from './Card';
import { EVENT_COLORS } from '../constants';

interface EditInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instructor: Instructor) => void;
  instructor: Instructor | null;
  isAddMode: boolean;
}

export const EditInstructorModal: React.FC<EditInstructorModalProps> = ({ isOpen, onClose, onSave, instructor, isAddMode }) => {
  const [formData, setFormData] = useState<Instructor | null>(null);

  useEffect(() => {
    if (isAddMode) {
      setFormData({
        id: '',
        name: '',
        specialty: '',
        color: EVENT_COLORS[0],
        profilePictureUrl: undefined,
        status: 'active',
      });
    } else {
      setFormData(instructor);
    }
  }, [instructor, isAddMode]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => prev ? { ...prev, color } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData && formData.name.trim() && formData.specialty.trim()) {
      onSave(formData);
    }
  };
  
  const inputClasses = "w-full bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-2 text-text-primary dark:text-slate-100 focus:ring-brand-primary dark:focus:ring-brand-secondary focus:border-brand-primary dark:focus:border-brand-secondary";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-instructor-title">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md">
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h2 id="edit-instructor-title" className="text-xl font-bold text-text-primary dark:text-slate-100 mb-6">
                {isAddMode ? 'Add New Instructor' : 'Edit Instructor'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Specialty</label>
                  <input
                    type="text"
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">Color Code</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`w-8 h-8 rounded-full transition-all duration-150 border-2 ${formData.color === color ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-brand-primary dark:ring-brand-secondary border-white dark:border-slate-800' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

            </div>
            <div className="bg-surface-header dark:bg-slate-700/50 p-4 flex justify-end items-center rounded-b-lg border-t border-surface-border dark:border-slate-700">
                <div className="flex space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md font-semibold text-text-secondary dark:text-slate-300 bg-surface-input dark:bg-slate-600 hover:brightness-95 dark:hover:bg-slate-500 transition-all">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-md font-semibold text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity">
                        {isAddMode ? 'Add Instructor' : 'Save Changes'}
                    </button>
                </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};