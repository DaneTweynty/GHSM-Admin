


import React, { useMemo } from 'react';
import type { Lesson, Student, Instructor } from '../types';
import { DAYS_OF_WEEK_SHORT, toYYYYMMDD } from '../constants';

interface MonthViewProps {
  lessons: Lesson[];
  students: Student[];
  instructors: Instructor[];
  currentDate: Date;
  onEditLesson: (lesson: Lesson) => void;
  onAddLesson: (date: Date) => void;
  onUpdateLessonPosition: (lessonId: string, newDate: Date, newTime: string | undefined, isCopy: boolean) => void;
  onLessonDragStart: (e: React.DragEvent, lesson: Lesson) => void;
}

const NoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
);

export const MonthView: React.FC<MonthViewProps> = ({
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

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    lessons.forEach(lesson => {
        const key = lesson.date;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(lesson);
    });
    // Sort lessons within each day
    for (const dayLessons of map.values()) {
        dayLessons.sort((a,b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [lessons]);

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = daysInPrevMonth - firstDayOfMonth + i + 1;
      grid.push({ date: new Date(year, month - 1, day), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const gridEndIndex = grid.length;
    const nextMonthDays = (7 - (gridEndIndex % 7)) % 7;
    for (let i = 1; i <= nextMonthDays; i++) {
        grid.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return grid;
  }, [currentDate]);
  
  const today = new Date();

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
  };
  
  const handleDrop = (e: React.DragEvent, date: Date) => {
      e.preventDefault();
      const lessonId = e.dataTransfer.getData('lessonId');
      if (lessonId) {
          onUpdateLessonPosition(lessonId, date, undefined, e.altKey);
      }
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-px bg-surface-border dark:bg-slate-700 border border-surface-border dark:border-slate-700 rounded-md overflow-hidden min-w-[980px]">
      {DAYS_OF_WEEK_SHORT.map(day => (
        <div key={day} className="text-center font-medium text-text-secondary dark:text-slate-400 text-xs sm:text-sm py-2 bg-surface-header dark:bg-slate-800">
          {day}
        </div>
      ))}
      
      {calendarGrid.map(({ date, isCurrentMonth }, index) => {
        const dateString = toYYYYMMDD(date);
        const lessonsForDay = lessonsByDate.get(dateString) || [];
        const isToday = date.toDateString() === today.toDateString();
        const isWeekend = [0,6].includes(date.getDay());

        return (
          <div 
            key={index} 
            className={`relative p-1 sm:p-1.5 min-h-[90px] md:min-h-[120px] flex flex-col transition-colors ${isCurrentMonth ? 'bg-surface-card dark:bg-slate-800' : 'bg-surface-header/50 dark:bg-slate-900/50'}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, date)}
            onDragEnter={(e) => e.currentTarget.classList.add('bg-brand-primary-light', 'dark:bg-brand-primary/20')}
            onDragLeave={(e) => e.currentTarget.classList.remove('bg-brand-primary-light', 'dark:bg-brand-primary/20')}
          >
            {isWeekend && (
              <div className="absolute inset-0 bg-surface-hover/30 dark:bg-slate-700/15 pointer-events-none rounded-sm" />
            )}
            <div className="flex justify-between items-start">
              <span className={`text-xs font-semibold p-1.5 rounded-full flex items-center justify-center h-6 w-6 ${isToday ? 'bg-brand-primary text-text-on-color' : ''} ${isCurrentMonth ? 'text-text-secondary dark:text-slate-400' : 'text-text-tertiary/70 dark:text-slate-600'}`}>
                {date.getDate()}
              </span>
              {isCurrentMonth && (
                  <button onClick={(e) => { e.stopPropagation(); onAddLesson(date)}} className="text-text-tertiary dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-primary transition-colors p-1 rounded-full hover:bg-surface-hover dark:hover:bg-slate-700" aria-label={`Add lesson on ${date.toLocaleDateString()}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" /></svg>
                  </button>
              )}
            </div>
            <div className="mt-1 space-y-1 overflow-y-auto flex-grow">
              {isCurrentMonth && lessonsForDay.map(lesson => {
                  const student = studentMap.get(lesson.studentId);
                  const instructor = instructorMap.get(lesson.instructorId);
                  const hasNote = lesson.notes && lesson.notes.trim() !== '';

                  return (
                      <div key={lesson.id} className="relative group">
                          <button
                              onDoubleClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                              style={{ backgroundColor: instructor?.color }}
                              className={`w-full text-left p-1 md:p-1.5 rounded-md text-text-on-color dark:text-slate-800 text-[10px] md:text-[11px] leading-tight transition-all hover:opacity-80 dark:hover:opacity-90 active:cursor-grabbing cursor-grab`}
                              title={`Lesson: ${student?.name} at ${lesson.time}${hasNote ? `\nHas note` : ''}\nDouble-click to edit.`}
                              aria-label={`Lesson for ${student?.name} at ${lesson.time}${hasNote ? '. This lesson has a note.' : ''}. Double click to edit.`}
                              draggable="true"
                              onDragStart={(e) => onLessonDragStart(e, lesson)}
                          >
                              <div className="flex justify-between items-start">
                                 <div className="font-bold truncate">{lesson.time}</div>
                                 {hasNote && <NoteIcon />}
                              </div>
                              <div className="truncate opacity-80">{student?.name}</div>
                          </button>
                      </div>
                  )
              })}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  );
};