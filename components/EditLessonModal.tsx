
import React, { useState, useEffect } from 'react';
import type { Lesson, Instructor, Student } from '../types';
import { ROOM_COUNT, ICONS, LUNCH_BREAK_TIME } from '../constants';
import { Card } from './Card';

// Local type for the form data to handle all fields
interface LessonFormData {
  id: string;
  studentId: string;
  instructorId: string;
  roomId: number;
  date: string;
  time: string;
  notes?: string;
}

interface EditLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLesson: LessonFormData) => void;
  onMoveToTrash: (lessonId: string) => void;
  lesson: Lesson | null;
  isAddMode: boolean;
  instructors: Instructor[];
  students: Student[];
  allLessons: Lesson[];
  timeSlots: string[];
}

export const EditLessonModal: React.FC<EditLessonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onMoveToTrash,
  lesson,
  isAddMode,
  instructors,
  students,
  allLessons,
  timeSlots
}) => {
  const [formData, setFormData] = useState<LessonFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableTimeSlots = timeSlots.filter(t => t !== LUNCH_BREAK_TIME);

  useEffect(() => {
    if (lesson) {
      if (isAddMode) {
        const firstActiveStudent = students.find(s => s.status === 'active');
        setFormData({
            id: lesson.id,
            studentId: firstActiveStudent?.id || '',
            instructorId: instructors.length > 0 ? instructors[0].id : '',
            roomId: lesson.roomId,
            date: lesson.date,
            time: lesson.time,
            notes: lesson.notes || '',
        });
      } else {
        setFormData({
            id: lesson.id,
            studentId: lesson.studentId,
            instructorId: lesson.instructorId,
            roomId: lesson.roomId,
            date: lesson.date,
            time: lesson.time,
            notes: lesson.notes || '',
        });
      }
    } else {
      setFormData(null);
    }
    setError(null);
  }, [lesson, isAddMode, students, instructors]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: name === 'roomId' ? parseInt(value) : value } : null);
    setError(null);
  };
  
  const isConflict = (updatedLesson: LessonFormData): string | null => {
    const { id, date, time, instructorId, roomId, studentId } = updatedLesson;

    for (const l of allLessons) {
      if (l.id === id || l.status === 'deleted') continue; // Don't check against itself or deleted lessons
      if (l.date === date && l.time === time) {
        if (l.instructorId === instructorId) {
          const conflictingInstructor = instructors.find(i => i.id === instructorId);
          return `Instructor ${conflictingInstructor?.name || ''} is already scheduled at this time.`;
        }
        if (l.roomId === roomId) {
          return `Room ${roomId} is already booked at this time.`;
        }
        if (l.studentId === studentId) {
            const conflictingStudent = students.find(s => s.id === studentId);
            return `Student ${conflictingStudent?.name || ''} already has a lesson at this time.`;
        }
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    if (isAddMode) {
      const student = students.find(s => s.id === formData.studentId);
      if (!student) {
        setError("Please select a student.");
        return;
      }
      if (student.status === 'inactive') {
        const warningMessage = `Student "${student.name}" is not enrolled. Please activate the student to schedule new lessons.`;
        setError(warningMessage);
        window.alert(warningMessage);
        return;
      }
    }

    const conflictMessage = isConflict(formData);
    if(conflictMessage) {
        setError(conflictMessage);
        return;
    }
    
    onSave(formData);
  };
  
  const handleTrash = () => {
    if (lesson) {
        onMoveToTrash(lesson.id);
    }
  };

  const inputClasses = "w-full bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-2 text-text-primary dark:text-slate-100 focus:ring-brand-primary dark:focus:ring-brand-secondary focus:border-brand-primary dark:focus:border-brand-secondary";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-lesson-title">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-lg">
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h2 id="edit-lesson-title" className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-2">
                {isAddMode ? 'Add New Lesson' : 'Edit Lesson'}
              </h2>
              {!isAddMode && (
                <p className="text-text-secondary dark:text-slate-400 mb-6">Student: <span className="font-semibold text-brand-secondary">{students.find(s => s.id === formData.studentId)?.name || 'Unknown'}</span></p>
              )}
              
              {error && <div className="bg-status-red-light dark:bg-status-red/20 border border-status-red/20 text-status-red px-4 py-3 rounded-md mb-4 font-medium" role="alert">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isAddMode ? (
                   <>
                    <div className="md:col-span-2">
                      <label htmlFor="studentId" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Student</label>
                      <select id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} className={inputClasses} required>
                        <option value="" disabled>Select a student</option>
                        {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.status === 'inactive' ? '(Not Enrolled)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="instructorId" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Instructor</label>
                        <select id="instructorId" name="instructorId" value={formData.instructorId} onChange={handleChange} className={inputClasses}>
                            {instructors.length > 0 ? (
                                instructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.specialty})</option>)
                            ) : (
                                <option>No instructors available</option>
                            )}
                        </select>
                    </div>
                   </>
                ) : (
                    <div className="md:col-span-2">
                        <label htmlFor="instructorId" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Instructor</label>
                        <select id="instructorId" name="instructorId" value={formData.instructorId} onChange={handleChange} className={inputClasses}>
                            {instructors.length > 0 ? (
                                instructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.specialty})</option>)
                            ) : (
                                <option>No instructors available</option>
                            )}
                        </select>
                    </div>
                )}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Date</label>
                  <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Time</label>
                  <select id="time" name="time" value={formData.time} onChange={handleChange} className={inputClasses}>
                    {availableTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="roomId" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Room</label>
                  <input type="number" id="roomId" name="roomId" value={formData.roomId} onChange={handleChange} min="1" max={ROOM_COUNT} className={inputClasses} />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="notes" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={3}
                  className={inputClasses}
                  placeholder="Add any specific notes for this lesson..."
                />
              </div>
            </div>
            <div className="bg-surface-header dark:bg-slate-700/50 p-4 flex justify-between items-center rounded-b-lg border-t border-surface-border dark:border-slate-700">
                <div>
                    {!isAddMode && (
                        <button
                            type="button"
                            onClick={handleTrash}
                            className="px-4 py-2 rounded-md font-semibold text-white bg-status-red hover:opacity-90 transition-opacity flex items-center space-x-2"
                            aria-label="Move this lesson to the trash"
                        >
                            {ICONS.trash}
                            <span>Move to Trash</span>
                        </button>
                    )}
                </div>
                <div className="flex space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md font-semibold text-text-secondary dark:text-slate-300 bg-surface-input dark:bg-slate-600 hover:brightness-95 dark:hover:bg-slate-500 transition-all">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-md font-semibold text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity">
                        {isAddMode ? 'Add Lesson' : 'Save Changes'}
                    </button>
                </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
