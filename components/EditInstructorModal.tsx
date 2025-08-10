import React, { useState, useEffect } from 'react';
import type { Instructor } from '../types';
import { control } from './ui';
import { EVENT_COLORS } from '../constants';
import { INSTRUMENT_OPTIONS } from '../constants';

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
        specialty: [],
        color: EVENT_COLORS[0],
        profilePictureUrl: undefined,
        status: 'active',
        email: '',
        phone: '',
        bio: '',
      });
    } else {
      setFormData(instructor);
    }
  }, [instructor, isAddMode]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSpecialtyChange = (instrument: string, checked: boolean) => {
    setFormData(prev => {
      if (!prev) return null;
      const currentSpecialty = Array.isArray(prev.specialty) ? prev.specialty : [];
      const newSpecialty = checked 
        ? [...currentSpecialty, instrument]
        : currentSpecialty.filter(s => s !== instrument);
      return { ...prev, specialty: newSpecialty };
    });
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => prev ? { ...prev, color } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData && formData.name.trim() && Array.isArray(formData.specialty) && formData.specialty.length > 0) {
      onSave(formData);
    }
  };
  
  const inputClasses = control;
  const currentSpecialty = Array.isArray(formData.specialty) ? formData.specialty : [];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-instructor-title">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md max-h-[90vh] min-h-[60vh] flex flex-col bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg shadow-[0_1px_2px_rgba(16,24,40,0.06),_0_1px_3px_rgba(16,24,40,0.10)] dark:shadow-none">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          {/* Fixed Header */}
          <div className="p-6 border-b border-surface-border dark:border-slate-700 flex-shrink-0">
            <h2 id="edit-instructor-title" className="text-xl font-bold text-text-primary dark:text-slate-100">
              {isAddMode ? 'Add New Instructor' : 'Edit Instructor'}
            </h2>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto thin-scroll">
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Instructor Name *</label>
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
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  className={inputClasses}
                  rows={3}
                  placeholder="Brief description about the instructor..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Specialties *</label>
                <div className="grid grid-cols-1 gap-3 min-h-[120px]">
                  {INSTRUMENT_OPTIONS.map(instrument => (
                    <label key={instrument} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={currentSpecialty.includes(instrument)}
                          onChange={(e) => handleSpecialtyChange(instrument, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          currentSpecialty.includes(instrument)
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                        }`}>
                          {currentSpecialty.includes(instrument) && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-text-primary dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{instrument}</span>
                    </label>
                  ))}
                </div>
                {currentSpecialty.length === 0 && (
                  <p className="text-xs text-red-500 mt-2 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Please select at least one specialty</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="bg-surface-header dark:bg-slate-700/50 p-4 flex justify-end items-center border-t border-surface-border dark:border-slate-700 flex-shrink-0">
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-md font-semibold text-text-secondary dark:text-slate-300 bg-surface-input dark:bg-slate-600 hover:brightness-95 dark:hover:bg-slate-500 transition-all">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-md font-semibold text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity">
                {isAddMode ? 'Add Instructor' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
