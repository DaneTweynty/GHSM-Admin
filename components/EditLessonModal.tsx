
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import type { Lesson, Instructor, Student } from '../types';
import { ROOM_COUNT, ICONS, LUNCH_BREAK_TIME } from '../constants';
import { addMinutes, toMinutes, to12Hour, toHHMM } from '../utils/time';
import { Card } from './Card';
import { control, selectIconless } from './ui';
import ThemedSelect from './ThemedSelect';

// Local type for the form data to handle all fields
interface LessonFormData {
  id: string;
  studentId: string;
  instructorId: string;
  roomId: number;
  date: string;
  time: string; // start time
  endTime?: string; // end time
  notes?: string;
  repeatWeekly?: boolean;
  repeatWeeks?: number; // number of additional weeks to repeat
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
  // --- Helpers ---
  const to24 = (h12: number, m: number, ampm: 'AM' | 'PM') => {
    let h = h12 % 12;
    if (ampm === 'PM') h += 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<LessonFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  const startPickerBtnRef = useRef<HTMLButtonElement>(null);
  const endPickerBtnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Build per-minute options from first slot to last slot + 60m
  const minuteOptions = useMemo(() => {
    const opts: string[] = [];
    if (timeSlots.length === 0) return opts;
    let t = timeSlots[0];
    const end = addMinutes(timeSlots[timeSlots.length - 1], 60);
    while (toMinutes(t) <= toMinutes(end)) {
      opts.push(t);
      t = addMinutes(t, 1);
    }
    return opts;
  }, [timeSlots]);

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
            endTime: lesson.endTime || addMinutes(lesson.time, 60),
            notes: lesson.notes || '',
            repeatWeekly: false,
            repeatWeeks: 11, // default to 11 more weeks (total 12)
        });
      } else {
        setFormData({
            id: lesson.id,
            studentId: lesson.studentId,
            instructorId: lesson.instructorId,
            roomId: lesson.roomId,
            date: lesson.date,
            time: lesson.time,
            endTime: lesson.endTime || addMinutes(lesson.time, 60),
            notes: lesson.notes || '',
            repeatWeekly: false,
            repeatWeeks: 11,
        });
      }
    } else {
      setFormData(null);
    }
    setError(null);
  }, [lesson, isAddMode, students, instructors]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Ensure end time cannot be set before start time in UI (must be before any early return)
  const endOptionsConstrained = useMemo(() => {
    if (!formData) return minuteOptions;
    return minuteOptions.filter(t => toMinutes(t) > toMinutes(formData.time));
  }, [minuteOptions, formData]);

  if (!isOpen || !formData) return null;

  // Store last-used duration per instructor (fallback to global)
  const getStoredDuration = (instructorId?: string): number | null => {
    const byInstructor = instructorId ? localStorage.getItem(`ghsm:lastDuration:${instructorId}`) : null;
    const global = localStorage.getItem('ghsm:lastDuration:global');
    return byInstructor ? parseInt(byInstructor, 10) : global ? parseInt(global, 10) : null;
  };
  const setStoredDuration = (instructorId: string | undefined, minutes: number) => {
    if (instructorId) localStorage.setItem(`ghsm:lastDuration:${instructorId}`, String(minutes));
    localStorage.setItem('ghsm:lastDuration:global', String(minutes));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return prev;
      if (name === 'roomId') return { ...prev, roomId: parseInt(value) };
      if (name === 'instructorId') {
        const next: LessonFormData = { ...prev, instructorId: value } as any;
        const stored = getStoredDuration(value);
        if (stored && toMinutes(next.time) + stored > toMinutes(next.time)) {
          next.endTime = addMinutes(next.time, stored);
        }
        return next;
      }
      if (name === 'time') {
        const newStart = value;
        const prevEnd = prev.endTime || addMinutes(prev.time, 60);
        const duration = toMinutes(prevEnd) - toMinutes(prev.time);
  const stored = (getStoredDuration(prev.instructorId) ?? duration) || 60;
        const proposedEnd = toMinutes(newStart) + Math.max(15, stored);
        const endStr = toHHMM(proposedEnd);
        return { ...prev, time: newStart, endTime: endStr };
      }
      if (name === 'endTime') {
        const newEnd = value;
        // if somehow end <= start, bump by 15
        const start = prev.time;
        const validEnd = toMinutes(newEnd) > toMinutes(start) ? newEnd : addMinutes(start, 15);
        // remember duration
        const dur = toMinutes(validEnd) - toMinutes(start);
        setStoredDuration(prev.instructorId, dur);
        return { ...prev, endTime: validEnd };
      }
      return { ...prev, [name]: value } as LessonFormData;
    });
    setError(null);
  };

  // endOptionsConstrained declared above to preserve hooks order
  
  const isConflict = (updatedLesson: LessonFormData): string | null => {
    const { id, date, time, endTime, instructorId, roomId, studentId } = updatedLesson;
    const s1 = toMinutes(time);
    const e1 = toMinutes(endTime || addMinutes(time, 60));

    // lunch overlap
    const lunchMin = toMinutes(LUNCH_BREAK_TIME);
  if (s1 < lunchMin && lunchMin < e1) {
      return `Cannot schedule overlapping the lunch break (${LUNCH_BREAK_TIME}).`;
    }

    for (const l of allLessons) {
      if (l.id === id || l.status === 'deleted') continue;
      if (l.date !== date) continue;
      const s2 = toMinutes(l.time);
      const e2 = toMinutes(l.endTime || addMinutes(l.time, 60));
  const overlap = s1 < e2 && s2 < e1; // half-open; allows back-to-back like 08:00-09:00 and 09:00-10:00
      if (overlap) {
        if (l.instructorId === instructorId) {
          const conflictingInstructor = instructors.find(i => i.id === instructorId);
          return `Instructor ${conflictingInstructor?.name || ''} is already scheduled during this time.`;
        }
        if (l.roomId === roomId) {
          return `Room ${roomId} is already booked during this time.`;
        }
        if (l.studentId === studentId) {
            const conflictingStudent = students.find(s => s.id === studentId);
            return `Student ${conflictingStudent?.name || ''} already has a lesson during this time.`;
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
  toast.error(warningMessage);
        return;
      }
    }

    // normalize to 15-min grid and ensure end > start
    const normalized = {
      ...formData,
      // keep exact minutes (no snapping)
      time: formData.time,
      endTime: formData.endTime ? formData.endTime : addMinutes(formData.time, 60),
    };
    // If end <= start, bump end to start + 15
    if (toMinutes(normalized.endTime!) <= toMinutes(normalized.time)) {
      normalized.endTime = addMinutes(normalized.time, 15);
    }

    const conflictMessage = isConflict(normalized);
    if(conflictMessage) {
        setError(conflictMessage);
        return;
    }
    
  onSave(normalized);
  };
  
  const handleTrash = () => {
    if (lesson) {
        onMoveToTrash(lesson.id);
    }
  };

  const inputClasses = control;
  // For selects that have a custom icon overlaid on the right, hide the native caret and add right padding
  const selectWithIconClasses = selectIconless;

  // Inline Time Picker Popover (minute-precise, keyboard + a11y)
  const TimePickerPopover: React.FC<{ value: string; onChange: (v: string) => void; onClose: () => void; presets?: Array<{ label: string; hh: number; mm: number; ampm: 'AM'|'PM' }>; anchorRef?: React.RefObject<HTMLButtonElement>; portalRoot?: React.RefObject<HTMLElement>; scrollParentRef?: React.RefObject<HTMLElement> }>
    = ({ value, onChange, onClose, presets = [], anchorRef, portalRoot, scrollParentRef }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [arrowX, setArrowX] = useState<number>(24);
    const [appeared, setAppeared] = useState(false);
    const width = 288; // w-72
    const computePos = () => {
      const btn = anchorRef?.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const scrollParent = scrollParentRef?.current;
      const scrollTop = scrollParent ? scrollParent.scrollTop : 0;
      
      // Calculate position relative to viewport
      let left = rect.left + (rect.width / 2) - (width / 2); // center under trigger
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      
      const top = rect.bottom + 8; // position below trigger
      
      setPos({ top, left });
      const anchorCenter = rect.left + rect.width / 2;
      const within = Math.max(12, Math.min(width - 12, anchorCenter - left));
      setArrowX(within);
    };
    useLayoutEffect(() => {
      computePos();
      const onWin = () => computePos();
      window.addEventListener('resize', onWin);
      window.addEventListener('scroll', onWin, true);
      const sc = scrollParentRef?.current;
      sc?.addEventListener('scroll', onWin, { passive: true });
      setTimeout(() => setAppeared(true), 0);
      return () => {
        window.removeEventListener('resize', onWin);
        window.removeEventListener('scroll', onWin, true);
        sc?.removeEventListener('scroll', onWin as any);
      };
    }, []);
    const [ampm, setAmpm] = useState<'AM'|'PM'>(() => (toMinutes(value) >= 12*60 ? 'PM' : 'AM'));
    const mins = toMinutes(value);
    let h24 = Math.floor(mins / 60);
    const initialM = mins % 60;
    let h12 = h24 % 12; if (h12 === 0) h12 = 12;
    const [selHour, setSelHour] = useState<number>(h12);
    const [selMin, setSelMin] = useState<number>(initialM);
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    const apply = (hh = selHour, mm = selMin, mer = ampm) => {
      const v = to24(hh, mm, mer);
      onChange(v);
      onClose();
      // return focus to trigger
      anchorRef?.current?.focus();
    };
    useEffect(() => {
      containerRef.current?.focus();
    }, []);
    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); anchorRef?.current?.focus(); }
      if (e.key === 'Enter') { e.preventDefault(); apply(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelMin(m => (m + 59) % 60); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelMin(m => (m + 1) % 60); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setSelHour(h => (h + 10) % 12 + 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setSelHour(h => (h % 12) + 1); }
      if (e.key === 'Tab') {
        // basic trap: keep focus on container
        e.preventDefault();
        containerRef.current?.focus();
      }
    };
    const pop = (
      <div ref={containerRef} tabIndex={-1} role="dialog" aria-label="Time picker" onKeyDown={onKeyDown}
           style={{ position: 'fixed', top: pos.top, left: pos.left, width }}
           className={`z-[9999] rounded-md border border-white/10 bg-surface-card dark:bg-slate-800 shadow-2xl ring-1 ring-black/10 outline-none transform transition duration-150 ease-out ${appeared ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
           onClick={e=>e.stopPropagation()}>
        {/* Arrow */}
        <div style={{ position: 'absolute', top: -6, left: arrowX - 6 }} className="w-3 h-3 rotate-45 bg-surface-card dark:bg-slate-800 border-l border-t border-white/10"></div>
        <div className="p-3 grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
          <div className="max-h-40 overflow-y-auto thin-scroll border border-surface-border dark:border-slate-600 rounded">
            {hours.map(h => (
              <button
                key={h}
                className={`w-full px-2 py-1 text-left hover:bg-surface-hover dark:hover:bg-slate-700 ${h===selHour ? 'font-semibold bg-surface-hover dark:bg-slate-700' : ''}`}
                onClick={()=>{ setSelHour(h); apply(h, selMin, ampm); }}
              >{String(h).padStart(2,'0')}</button>
            ))}
          </div>
          <div className="max-h-40 overflow-y-auto thin-scroll border border-surface-border dark:border-slate-600 rounded">
            {minutes.map(mm => (
              <button
                key={mm}
                className={`w-full px-2 py-1 text-left hover:bg-surface-hover dark:hover:bg-slate-700 ${mm=== selMin ? 'font-semibold bg-surface-hover dark:bg-slate-700' : ''}`}
                onClick={()=>{ setSelMin(mm); apply(selHour, mm, ampm); }}
              >{String(mm).padStart(2,'0')}</button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" className={`px-2 py-1 rounded ${ampm==='AM'?'bg-brand-primary text-text-on-color':'bg-surface-input dark:bg-slate-700'}`} onClick={()=>setAmpm('AM')}>AM</button>
            <button type="button" className={`px-2 py-1 rounded ${ampm==='PM'?'bg-brand-primary text-text-on-color':'bg-surface-input dark:bg-slate-700'}`} onClick={()=>setAmpm('PM')}>PM</button>
            <button type="button" className="mt-2 px-2 py-1 rounded border border-surface-border dark:border-slate-600 hover:bg-surface-hover dark:hover:bg-slate-700" onClick={()=>apply()}>Apply</button>
          </div>
        </div>
        {presets.length>0 && (
          <div className="px-3 pb-3">
            <div className="text-xs mb-1 text-text-secondary dark:text-slate-400">Presets</div>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button key={p.label} className="px-2 py-1 rounded-full border border-surface-border dark:border-slate-600 hover:bg-surface-hover dark:hover:bg-slate-700 text-sm" onClick={()=>apply(p.hh, p.mm, p.ampm)}>{p.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
    const root = (portalRoot?.current as any) || document.body;
    return createPortal(pop, root);
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-hidden" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-lesson-title">
      {(isStartPickerOpen || isEndPickerOpen) && (
        <div
          className="fixed inset-0 z-[9998] bg-transparent"
          onClick={(e) => { e.stopPropagation(); setIsStartPickerOpen(false); setIsEndPickerOpen(false); }}
        />
      )}
      <div ref={contentScrollRef} onClick={e => e.stopPropagation()} className="w-full max-w-lg my-8 max-h-[90vh] flex flex-col bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg shadow-[0_1px_2px_rgba(16,24,40,0.06),_0_1px_3px_rgba(16,24,40,0.10)] dark:shadow-none">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          {/* Fixed Header */}
          <div className="p-4 border-b border-surface-border dark:border-slate-700 flex-shrink-0">
            <h2 id="edit-lesson-title" className="text-xl font-bold text-text-primary dark:text-slate-100">
              {isAddMode ? 'Add New Lesson' : 'Edit Lesson'}
            </h2>
            {!isAddMode && (
              <p className="text-text-secondary dark:text-slate-400">Student: <span className="font-semibold text-brand-secondary">{students.find(s => s.id === formData.studentId)?.name || 'Unknown'}</span></p>
            )}
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto thin-scroll">
            <div className="p-6">
              
              {error && <div className="bg-status-red-light dark:bg-status-red/20 border border-status-red/20 text-status-red px-4 py-3 rounded-md mb-4 font-medium" role="alert">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isAddMode ? (
                   <>
                    <div className="md:col-span-2">
                      <label htmlFor="studentId" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Student</label>
                      <ThemedSelect id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} required>
                        <option value="" disabled>Select a student</option>
                        {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.status === 'inactive' ? '(Not Enrolled)' : ''}
                          </option>
                        ))}
                      </ThemedSelect>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="instructorId" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Instructor</label>
                        <ThemedSelect id="instructorId" name="instructorId" value={formData.instructorId} onChange={handleChange}>
                            {instructors.length > 0 ? (
                                instructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.specialty})</option>)
                            ) : (
                                <option>No instructors available</option>
                            )}
                        </ThemedSelect>
                    </div>
                   </>
                ) : (
                    <div className="md:col-span-2">
                        <label htmlFor="instructorId" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Instructor</label>
                        <ThemedSelect id="instructorId" name="instructorId" value={formData.instructorId} onChange={handleChange}>
                            {instructors.length > 0 ? (
                                instructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.specialty})</option>)
                            ) : (
                                <option>No instructors available</option>
                            )}
                        </ThemedSelect>
                    </div>
                )}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Date</label>
                  <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className={inputClasses} />
                </div>
                <div className="relative">
                  <label htmlFor="time" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Start Time</label>
                  <div className="relative">
                    <select id="time" name="time" value={formData.time} onChange={handleChange} className={selectWithIconClasses}>
                      {minuteOptions.map(t => <option key={t} value={t}>{to12Hour(t)}</option>)}
                    </select>
                    <button ref={startPickerBtnRef} type="button" aria-label="Open start time picker" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-primary" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setIsStartPickerOpen(v=>!v); setIsEndPickerOpen(false); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H6z"/><path d="M18 9H2v6a2 2 0 002 2h12a2 2 0 002-2V9z"/></svg>
                    </button>
                    {isStartPickerOpen && (
                      <TimePickerPopover
                        value={formData.time}
                        onChange={(v)=>{
                          // reuse existing change logic
                          handleChange({ target: { name: 'time', value: v } } as any);
                        }}
                        onClose={()=>setIsStartPickerOpen(false)}
                        anchorRef={startPickerBtnRef}
                        portalRoot={overlayRef}
                        scrollParentRef={contentScrollRef}
                        presets={[{label:'9 AM', hh:9, mm:0, ampm:'AM'}, {label:'12 PM', hh:12, mm:0, ampm:'PM'}, {label:'4 PM', hh:4, mm:0, ampm:'PM'}, {label:'6 PM', hh:6, mm:0, ampm:'PM'}]}
                      />
                    )}
                  </div>
                </div>
                <div className="relative">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="endTime" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">End Time</label>
                    {/* Duration hint */}
                    {formData.endTime && (
                      <span className={`text-xs ${toMinutes(formData.endTime) - toMinutes(formData.time) < 15 ? 'text-status-red' : 'text-text-secondary'}`}>+{toMinutes(formData.endTime) - toMinutes(formData.time)} min</span>
                    )}
                  </div>
                  <div>
                    <div className="relative">
                      <select id="endTime" name="endTime" value={formData.endTime || ''} onChange={handleChange} className={selectWithIconClasses}>
                        {endOptionsConstrained.map(t => <option key={t} value={t}>{to12Hour(t)}</option>)}
                      </select>
                      <button ref={endPickerBtnRef} type="button" aria-label="Open end time picker" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-primary" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setIsEndPickerOpen(v=>!v); setIsStartPickerOpen(false); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H6z"/><path d="M18 9H2v6a2 2 0 002 2h12a2 2 0 002-2V9z"/></svg>
                      </button>
                      {isEndPickerOpen && (
                        <TimePickerPopover
                          value={formData.endTime || addMinutes(formData.time, 60)}
                          onChange={(v)=>{
                            handleChange({ target: { name: 'endTime', value: v } } as any);
                          }}
                          onClose={()=>setIsEndPickerOpen(false)}
                          anchorRef={endPickerBtnRef}
                          portalRoot={overlayRef}
                          scrollParentRef={contentScrollRef}
                          presets={[{label:'Top of hour', hh: (Math.max(1, ((Math.floor(toMinutes(formData.time)/60)%12)||12))), mm:0, ampm: (toMinutes(formData.time)>=12*60)?'PM':'AM'}]}
                        />
                      )}
                    </div>
                    {/* Quick duration buttons */}
                    <div className="mt-2 flex gap-2">
                      {[30,45,60].map(d => (
                        <button key={d} type="button" className="px-2 py-1 rounded-full border border-surface-border dark:border-slate-600 text-sm hover:bg-surface-hover dark:hover:bg-slate-700" onClick={()=>{
                          const newEnd = addMinutes(formData.time, d);
                          handleChange({ target: { name: 'endTime', value: newEnd } } as any);
                        }}>+{d}m</button>
                      ))}
                    </div>
                  </div>
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

              {/* Repeat weekly options (add/edit) */}
              <div className="mt-4 space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="repeatWeekly"
                      checked={!!formData.repeatWeekly}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, repeatWeekly: e.target.checked } : prev)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      formData.repeatWeekly
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                    }`}>
                      {formData.repeatWeekly && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-text-primary dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Repeat weekly</span>
                </label>
                {formData.repeatWeekly && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="repeatWeeks" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Number of additional weeks</label>
                      <input
                        id="repeatWeeks"
                        type="number"
                        min={1}
                        max={52}
                        value={formData.repeatWeeks || 1}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, repeatWeeks: Math.max(1, Math.min(52, parseInt(e.target.value || '1'))) } : prev)}
                        className={inputClasses}
                      />
                    </div>
                    <div className="text-xs text-text-secondary dark:text-slate-400 self-end">
                      Enabling this will also schedule this lesson every week on the same weekday and time for the next {formData.repeatWeeks || 1} week(s).
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Fixed Footer */}
          <div className="p-4 border-t border-surface-border dark:border-slate-700 flex-shrink-0">
            <div className="flex justify-between items-center">
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
          </div>
        </form>
      </div>
    </div>
  );
};
