





import React, { useMemo, useState } from 'react';
import type { Lesson, Student, Instructor } from '../types';
import { TIME_SLOTS, DAYS_OF_WEEK_SHORT, DAYS_OF_WEEK_FULL, toYYYYMMDD, LUNCH_BREAK_TIME } from '../constants';

interface WeekViewProps {
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
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
);

const LunchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v9a1 1 0 001 1h10a1 1 0 001-1V8l-.007-.117A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm-2 4V6a2 2 0 114 0v1H8z" />
        <path d="M5 11h10a1 1 0 010 2H5a1 1 0 010-2z" />
    </svg>
);

export const WeekView: React.FC<WeekViewProps> = ({
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

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date);
    }
    return dates;
  }, [currentDate]);

  const [activeDayIndex, setActiveDayIndex] = useState(() => {
      const today = new Date();
      const todayIndex = weekDates.findIndex(d => d.toDateString() === today.toDateString());
      return todayIndex !== -1 ? todayIndex : currentDate.getDay();
  });
  
  const lessonsBySlot = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    const weekDateStrings = new Set(weekDates.map(d => toYYYYMMDD(d)));

    lessons.forEach(lesson => {
        if (weekDateStrings.has(lesson.date)) {
            const key = `${lesson.date}-${lesson.time}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(lesson);
        }
    });
    return map;
  }, [lessons, weekDates]);

  const today = new Date();
  
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
  };
  
  const handleDrop = (e: React.DragEvent, date: Date, time: string) => {
      e.preventDefault();
      const lessonId = e.dataTransfer.getData('lessonId');
      if (lessonId) {
          onUpdateLessonPosition(lessonId, date, time, e.altKey);
      }
  };

  const activeDate = weekDates[activeDayIndex];
  const lessonsForActiveDay = useMemo(() => {
      const map = new Map<string, Lesson[]>();
      const dateString = toYYYYMMDD(activeDate);
      lessons
        .filter(l => l.date === dateString)
        .forEach(lesson => {
            const key = lesson.time;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(lesson);
        });
      return map;
  }, [lessons, activeDate]);

  return (
    <div className="border border-surface-border dark:border-slate-700 rounded-md overflow-hidden bg-surface-card dark:bg-slate-800">
        {/* Mobile Tab View */}
        <div className="md:hidden">
            <div className="border-b border-surface-border dark:border-slate-700">
                <nav className="-mb-px flex space-x-2 overflow-x-auto p-2" aria-label="Tabs">
                    {weekDates.map((date, index) => (
                    <button
                        key={date.toISOString()}
                        onClick={() => setActiveDayIndex(index)}
                        className={`whitespace-nowrap flex-shrink-0 p-2 border-b-2 font-medium text-sm rounded-t-md transition-colors ${
                        activeDayIndex === index
                            ? 'border-brand-primary text-brand-primary'
                            : 'border-transparent text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                        }`}
                    >
                        {DAYS_OF_WEEK_SHORT[date.getDay()]} {date.getDate()}
                    </button>
                    ))}
                </nav>
            </div>
            <div className="p-2 space-y-2">
                 {TIME_SLOTS.map(time => {
                     if (time === LUNCH_BREAK_TIME) {
                        return (
                            <div key={time} className="p-2 text-center rounded-md bg-surface-input/50 dark:bg-slate-700/50">
                                <div className="flex items-center justify-center h-full text-sm text-text-tertiary dark:text-slate-500 font-medium">
                                    <LunchIcon />
                                    Lunch Break
                                </div>
                            </div>
                        );
                     }
                     const lessonsInSlot = lessonsForActiveDay.get(time) || [];
                     return (
                        <div key={time} className="grid grid-cols-[auto_1fr] items-start gap-2">
                             <div className="text-right text-xs text-text-secondary dark:text-slate-400 font-mono mt-1 w-12">{time}</div>
                             <div 
                                className="relative p-1 border-l border-surface-border dark:border-slate-700 min-h-[50px] group transition-colors"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, activeDate, time)}
                                onDragEnter={(e) => e.currentTarget.classList.add('bg-brand-primary-light', 'dark:bg-brand-primary/20')}
                                onDragLeave={(e) => e.currentTarget.classList.remove('bg-brand-primary-light', 'dark:bg-brand-primary/20')}
                             >
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddLesson(activeDate, time); }}
                                    className="absolute -top-1 right-0 z-20 p-1 rounded-full text-text-tertiary dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label={`Add lesson on ${activeDate.toLocaleDateString()} at ${time}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" /></svg>
                                </button>
                                <div className="space-y-1">
                                    {lessonsInSlot.map(lesson => {
                                        const student = studentMap.get(lesson.studentId);
                                        const instructor = instructorMap.get(lesson.instructorId);
                                        const hasNote = lesson.notes && lesson.notes.trim() !== '';

                                        return (
                                            <div key={lesson.id} className="relative group/lesson">
                                                <button
                                                    onDoubleClick={() => onEditLesson(lesson)}
                                                    style={{ backgroundColor: instructor?.color }}
                                                    className={`w-full text-left p-1.5 rounded text-text-on-color dark:text-slate-800 text-xs leading-tight transition-all hover:opacity-80 dark:hover:opacity-90 active:cursor-grabbing cursor-grab`}
                                                    title={`Double-click to edit. ${student?.name} with ${instructor?.name} in Room ${lesson.roomId}${hasNote ? `\nNote: ${lesson.notes}` : ''}`}
                                                    draggable="true"
                                                    onDragStart={(e) => onLessonDragStart(e, lesson)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-bold truncate">{student?.name}</div>
                                                        {hasNote && <NoteIcon />}
                                                    </div>
                                                    <div className="truncate opacity-80">{instructor?.name} - R{lesson.roomId}</div>
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                 })}
            </div>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:block overflow-x-auto">
            <div className="grid grid-cols-[auto_repeat(7,minmax(120px,1fr))] min-w-[900px]">
                {/* Header: Time spacer */}
                <div className="text-xs p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 sticky left-0 z-10 text-text-secondary dark:text-slate-400">Time</div>
                
                {/* Header: Day labels */}
                {weekDates.map((date) => (
                    <div key={date.toISOString()} className="p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800">
                        <div className="text-xs text-text-secondary dark:text-slate-400">{DAYS_OF_WEEK_SHORT[date.getDay()]}</div>
                        <div className={`text-lg font-bold ${date.toDateString() === today.toDateString() ? 'text-brand-primary' : 'text-text-primary dark:text-slate-200'}`}>{date.getDate()}</div>
                    </div>
                ))}
                
                {/* Body: Time slots and lessons */}
                {TIME_SLOTS.map(time => {
                    if (time === LUNCH_BREAK_TIME) {
                        return (
                             <React.Fragment key={time}>
                                <div className="p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 sticky left-0 z-10">
                                    <span className="text-xs text-text-secondary dark:text-slate-400">{time}</span>
                                </div>
                                <div className="col-span-7 p-2 text-center border-b border-surface-border dark:border-slate-700 bg-surface-input/50 dark:bg-slate-700/50">
                                    <div className="flex items-center justify-center h-full text-sm text-text-tertiary dark:text-slate-500 font-medium">
                                        <LunchIcon />
                                        Lunch Break
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    }

                    return (
                        <React.Fragment key={time}>
                            {/* Time label column */}
                            <div className="p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 sticky left-0 z-10">
                                <span className="text-xs text-text-secondary dark:text-slate-400">{time}</span>
                            </div>
                            {/* Day columns */}
                            {weekDates.map(date => {
                                const slotKey = `${toYYYYMMDD(date)}-${time}`;
                                const lessonsInSlot = lessonsBySlot.get(slotKey) || [];
                                
                                return (
                                    <div 
                                        key={date.toISOString()} 
                                        className={`relative p-1 border-b border-r border-surface-border dark:border-slate-700 min-h-[60px] group transition-colors`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, date, time)}
                                        onDragEnter={(e) => e.currentTarget.classList.add('bg-brand-primary-light', 'dark:bg-brand-primary/20')}
                                        onDragLeave={(e) => e.currentTarget.classList.remove('bg-brand-primary-light', 'dark:bg-brand-primary/20')}
                                    >
                                        <button
                                          onClick={(e) => { e.stopPropagation(); onAddLesson(date, time); }}
                                          className="absolute top-1 right-1 z-20 p-1 rounded-full text-text-tertiary dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                                          aria-label={`Add lesson on ${date.toLocaleDateString()} at ${time}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" /></svg>
                                        </button>
                                         <div className="relative z-10 space-y-1 overflow-y-auto max-h-full">
                                            {lessonsInSlot.map(lesson => {
                                                const student = studentMap.get(lesson.studentId);
                                                const instructor = instructorMap.get(lesson.instructorId);
                                                const hasNote = lesson.notes && lesson.notes.trim() !== '';

                                                return (
                                                    <div key={lesson.id} className="relative group/lesson">
                                                        <button
                                                            onDoubleClick={() => onEditLesson(lesson)}
                                                            style={{ backgroundColor: instructor?.color }}
                                                            className={`w-full text-left p-1 rounded text-text-on-color dark:text-slate-800 text-[10px] leading-tight transition-all hover:opacity-80 dark:hover:opacity-90 active:cursor-grabbing cursor-grab`}
                                                            title={`Double-click to edit. ${student?.name} with ${instructor?.name} in Room ${lesson.roomId}${hasNote ? `\nNote: ${lesson.notes}` : ''}`}
                                                            draggable="true"
                                                            onDragStart={(e) => onLessonDragStart(e, lesson)}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="font-bold truncate">{student?.name}</div>
                                                                {hasNote && <NoteIcon />}
                                                            </div>
                                                            <div className="truncate opacity-80">{instructor?.name?.split(' ')[0]} - R{lesson.roomId}</div>
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    </div>
  );
};