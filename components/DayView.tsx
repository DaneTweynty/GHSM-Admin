



import React, { useMemo } from 'react';
import type { Lesson, Student, Instructor } from '../types';
import { DAYS_OF_WEEK_FULL, TIME_SLOTS, toYYYYMMDD, LUNCH_BREAK_TIME } from '../constants';

interface DayViewProps {
  lessons: Lesson[];
  students: Student[];
  instructors: Instructor[];
  currentDate: Date;
  onEditLesson: (lesson: Lesson) => void;
  onAddLesson: (date: Date, time: string) => void;
  onUpdateLessonPosition: (lessonId: string, newDate: Date, newTime: string, isCopy: boolean) => void;
  onLessonDragStart: (e: React.DragEvent, lesson: Lesson) => void;
}

const NoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
);

const LunchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v9a1 1 0 001 1h10a1 1 0 001-1V8l-.007-.117A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm-2 4V6a2 2 0 114 0v1H8z" />
        <path d="M5 11h10a1 1 0 010 2H5a1 1 0 010-2z" />
    </svg>
);


export const DayView: React.FC<DayViewProps> = ({
  lessons,
  students,
  instructors,
  currentDate,
  onEditLesson,
  onAddLesson,
  onUpdateLessonPosition,
  onLessonDragStart,
}) => {
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, i])), [instructors]);

  const dayOfWeek = useMemo(() => DAYS_OF_WEEK_FULL[currentDate.getDay()], [currentDate]);
  
  const lessonsByTime = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    const dateString = toYYYYMMDD(currentDate);
    lessons
      .filter(l => l.date === dateString)
      .forEach(lesson => {
        const key = lesson.time;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(lesson);
      });
    return map;
  }, [lessons, currentDate]);

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
  };

  const handleDrop = (e: React.DragEvent, time: string) => {
      e.preventDefault();
      const lessonId = e.dataTransfer.getData('lessonId');
      if (lessonId) {
          onUpdateLessonPosition(lessonId, currentDate, time, e.altKey);
      }
  };

  return (
     <div className="border border-surface-border dark:border-slate-700 rounded-md overflow-hidden bg-surface-card dark:bg-slate-800">
        <div className="grid grid-cols-[auto_1fr]">
            {/* Header */}
            <div className="p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 text-xs text-text-secondary dark:text-slate-400">Time</div>
            <div className="p-2 text-center border-b border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 text-xs font-semibold text-text-primary dark:text-slate-200 uppercase tracking-wider">{dayOfWeek}</div>

            {/* Body */}
            {TIME_SLOTS.map(time => {
                if (time === LUNCH_BREAK_TIME) {
                    return (
                        <React.Fragment key={time}>
                            <div className="p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800">
                                <span className="text-xs text-text-secondary dark:text-slate-400">{time}</span>
                            </div>
                            <div className="p-2 border-b border-surface-border dark:border-slate-700 bg-surface-input/50 dark:bg-slate-700/50 flex items-center justify-center min-h-[80px]">
                                <div className="text-sm text-text-tertiary dark:text-slate-500 font-medium flex items-center">
                                    <LunchIcon />
                                    Lunch Break
                                </div>
                            </div>
                        </React.Fragment>
                    );
                }

                const lessonsInSlot = lessonsByTime.get(time) || [];

                return (
                    <React.Fragment key={time}>
                        <div className="p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800">
                            <span className="text-xs text-text-secondary dark:text-slate-400">{time}</span>
                        </div>
                        <div 
                          className={`relative p-2 border-b border-surface-border dark:border-slate-700 min-h-[80px] group transition-colors`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, time)}
                          onDragEnter={(e) => e.currentTarget.classList.add('bg-brand-primary-light', 'dark:bg-brand-primary/20')}
                          onDragLeave={(e) => e.currentTarget.classList.remove('bg-brand-primary-light', 'dark:bg-brand-primary/20')}
                        >
                             <button
                                onClick={(e) => { e.stopPropagation(); onAddLesson(currentDate, time);}}
                                className="absolute top-2 right-2 z-20 p-1 rounded-full text-text-tertiary dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
                                aria-label={`Add lesson at ${time}`}
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" /></svg>
                              </button>
                             <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {lessonsInSlot.map(lesson => {
                                    const student = studentMap.get(lesson.studentId);
                                    const instructor = instructorMap.get(lesson.instructorId);
                                    const hasNote = lesson.notes && lesson.notes.trim() !== '';
                                    
                                    return (
                                        <div key={lesson.id} className="relative group/lesson">
                                            <button
                                                onDoubleClick={() => onEditLesson(lesson)}
                                                style={{ backgroundColor: instructor?.color }}
                                                className={`w-full text-left p-2 rounded text-text-on-color dark:text-slate-800 transition-all hover:opacity-80 dark:hover:opacity-90 flex flex-col justify-between min-h-[60px] active:cursor-grabbing cursor-grab`}
                                                title={`Double-click to edit. ${student?.name} with ${instructor?.name} in Room ${lesson.roomId}${hasNote ? `\nNote: ${lesson.notes}` : ''}`}
                                                draggable="true"
                                                onDragStart={(e) => onLessonDragStart(e, lesson)}
                                            >
                                                <div className="flex justify-between items-start w-full">
                                                    <div className="font-bold text-sm truncate">{student?.name}</div>
                                                    {hasNote && <NoteIcon />}
                                                </div>
                                                <div className="text-xs opacity-80 truncate">{instructor?.name}</div>
                                                <div className="text-xs opacity-80 font-mono">Room {lesson.roomId}</div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </React.Fragment>
                )
            })}
        </div>
     </div>
  );
};
