import React, { useMemo, useRef, useState } from 'react';
import type { Lesson, Student, Instructor } from '../types';
import { DAYS_OF_WEEK_FULL, TIME_SLOTS, toYYYYMMDD, LUNCH_BREAK_TIME } from '../constants';
import { addMinutes, roundToQuarter, toMinutes, toHHMM } from '../utils/time';

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
  const [dragGuide, setDragGuide] = useState<null | { top: number; height: number; label: string }>(null);
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, i])), [instructors]);

  const dayOfWeek = useMemo(() => DAYS_OF_WEEK_FULL[currentDate.getDay()], [currentDate]);
  const lessonsForDay = useMemo(() => lessons.filter(l => l.date === toYYYYMMDD(currentDate)), [lessons, currentDate]);

  // Time grid config
  const DAY_START = TIME_SLOTS[0];
  const DAY_END = addMinutes(TIME_SLOTS[TIME_SLOTS.length - 1], 60);
  const startMin = toMinutes(DAY_START);
  const endMin = toMinutes(DAY_END);
  const totalMin = endMin - startMin;
  const PX_PER_MIN = 2; // 120px per hour
  const HOUR_HEIGHT = 60 * PX_PER_MIN;

  // Compute lanes for overlapping lessons within groups
  type Placed = Lesson & { _lane: number; _lanes: number; _top: number; _height: number };
  const placedLessons: Placed[] = useMemo(() => {
    // Map to normalized bounds and sort by start
    const events = lessonsForDay.map(l => {
      const s = Math.max(startMin, toMinutes(l.time));
      const e = Math.min(endMin, toMinutes(l.endTime || addMinutes(l.time, 60)));
      return { l, s, e };
    }).filter(x => x.e > x.s).sort((a, b) => a.s - b.s);

    const results: Placed[] = [];
    let group: { l: Lesson; s: number; e: number }[] = [];
    let groupEnd = -1;

    const flushGroup = () => {
      if (group.length === 0) return;
      // Assign lanes greedily within the group
      const laneEnd: number[] = [];
      const laneOf: number[] = [];
      for (let i = 0; i < group.length; i++) {
        const ev = group[i];
        let lane = 0;
        for (; lane < laneEnd.length; lane++) {
          if (ev.s >= laneEnd[lane]) break;
        }
        if (lane === laneEnd.length) laneEnd.push(ev.e);
        else laneEnd[lane] = ev.e;
        laneOf[i] = lane;
      }
      const lanes = laneEnd.length;
      for (let i = 0; i < group.length; i++) {
        const ev = group[i];
        results.push({
          ...ev.l,
          _lane: laneOf[i],
          _lanes: lanes,
          _top: (ev.s - startMin) * PX_PER_MIN,
          _height: (ev.e - ev.s) * PX_PER_MIN,
        });
      }
      group = [];
      groupEnd = -1;
    };

    for (const ev of events) {
      if (group.length === 0 || ev.s < groupEnd) {
        group.push(ev);
        groupEnd = Math.max(groupEnd, ev.e);
      } else {
        flushGroup();
        group.push(ev);
        groupEnd = ev.e;
      }
    }
    flushGroup();
    return results;
  }, [lessonsForDay, startMin, endMin]);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleBackgroundDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const lessonId = e.dataTransfer.getData('lessonId');
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = Math.min(Math.max(e.clientY - rect.top, 0), totalMin * PX_PER_MIN);
    const minutesFromStart = Math.round(y / PX_PER_MIN);
    const proposed = toHHMM(startMin + minutesFromStart);
  const snapped = roundToQuarter(proposed);
    if (lessonId) onUpdateLessonPosition(lessonId, currentDate, snapped, e.altKey);
    setDragGuide(null);
  };

  const handleBackgroundDblClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = Math.min(Math.max(e.clientY - rect.top, 0), totalMin * PX_PER_MIN);
    const minutesFromStart = Math.round(y / PX_PER_MIN);
    const proposed = toHHMM(startMin + minutesFromStart);
  const snapped = roundToQuarter(proposed);
    onAddLesson(currentDate, snapped);
  };

  const handleBackgroundDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = Math.min(Math.max(e.clientY - rect.top, 0), totalMin * PX_PER_MIN);
    const minutesFromStart = Math.round(y / PX_PER_MIN);
    const proposed = toHHMM(startMin + minutesFromStart);
    const snapped = roundToQuarter(proposed);
    const lessonId = e.dataTransfer.getData('lessonId');
    const dragging = lessonsForDay.find(l => l.id === lessonId);
    const durationMin = dragging ? (toMinutes(dragging.endTime || addMinutes(dragging.time, 60)) - toMinutes(dragging.time)) : 60;
    const height = Math.max(20, durationMin * PX_PER_MIN);
    let top = (toMinutes(snapped) - startMin) * PX_PER_MIN;
    // keep within bounds
    const maxTop = totalMin * PX_PER_MIN - height;
    top = Math.max(0, Math.min(top, maxTop));
    const endSnap = toHHMM(Math.min(endMin, toMinutes(snapped) + durationMin));
    setDragGuide({ top, height, label: `${snapped}–${endSnap}` });
  };

  const handleBackgroundDragLeave = () => setDragGuide(null);

  const dayLabel = dayOfWeek;

  return (
    <div className="border border-surface-border dark:border-slate-700 rounded-md overflow-hidden bg-surface-card dark:bg-slate-800">
      {/* Header */}
      <div className="grid grid-cols-[64px_1fr]">
        <div className="p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 text-xs text-text-secondary dark:text-slate-400">Time</div>
        <div className="p-2 text-center border-b border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 text-xs font-semibold text-text-primary dark:text-slate-200 uppercase tracking-wider">{dayLabel}</div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[64px_1fr]">
        {/* Left time column */}
        <div className="relative" style={{ height: totalMin * PX_PER_MIN }}>
          {TIME_SLOTS.map((t, i) => (
            <div key={t} className="absolute left-0 right-0 px-2 text-right text-xs text-text-secondary dark:text-slate-400" style={{ top: i * HOUR_HEIGHT }}>
              {t}
            </div>
          ))}
        </div>
        {/* Right canvas */}
  <div className="relative border-l border-surface-border dark:border-slate-700" style={{ height: totalMin * PX_PER_MIN }}
       ref={canvasRef}
       onDragOver={handleBackgroundDragOver}
             onDrop={handleBackgroundDrop}
       onDragLeave={handleBackgroundDragLeave}
             onDoubleClick={handleBackgroundDblClick}
        >
          {/* Drag guide preview */}
          {dragGuide && (
            <div className="absolute left-0 right-0 pointer-events-none" style={{ top: dragGuide.top, height: dragGuide.height }}>
              <div className="absolute inset-0 border-2 border-dashed border-brand-primary/70 bg-brand-primary/10 rounded-sm" />
              <div className="absolute -left-1 -top-5 bg-brand-primary text-text-on-color text-[10px] px-1 py-0.5 rounded shadow-sm">
                {dragGuide.label}
              </div>
            </div>
          )}
          {/* Hour grid lines */}
          {TIME_SLOTS.map((t, i) => (
            <div key={t} className="absolute left-0 right-0 border-t border-surface-border/60 dark:border-slate-700/60" style={{ top: i * HOUR_HEIGHT }} />
          ))}

          {/* Quick add buttons at each hour */}
          {TIME_SLOTS.map((t, i) => (
            <button
              key={`add-${t}`}
              onClick={(e) => { e.stopPropagation(); onAddLesson(currentDate, t); }}
              className="absolute right-1 z-20 p-1 rounded-full text-text-tertiary dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
              style={{ top: i * HOUR_HEIGHT + 6 }}
              title={`Add lesson at ${t}`}
              aria-label={`Add lesson at ${t}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" /></svg>
            </button>
          ))}

          {/* Lunch shaded area */}
          {(() => {
            const l = toMinutes(LUNCH_BREAK_TIME);
            if (l >= startMin && l < endMin) {
              const top = (l - startMin) * PX_PER_MIN;
              return <div className="absolute left-0 right-0 bg-surface-input/50 dark:bg-slate-700/50" style={{ top, height: HOUR_HEIGHT }} />;
            }
            return null;
          })()}

          {/* Events */}
          {placedLessons.map(lesson => {
            const student = studentMap.get(lesson.studentId);
            const instructor = instructorMap.get(lesson.instructorId);
            const hasNote = lesson.notes && lesson.notes.trim() !== '';
            const width = `calc(100% / ${lesson._lanes} - 6px)`;
            const left = `calc(${lesson._lane} * 100% / ${lesson._lanes})`;
            const startLabel = lesson.time;
            const endLabel = lesson.endTime || addMinutes(lesson.time, 60);
            return (
              <div key={lesson.id}
                   className="absolute p-1"
                   style={{ top: lesson._top, left, width, height: Math.max(24, lesson._height) }}
              >
                <button
                  onDoubleClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                  style={{ backgroundColor: instructor?.color, height: '100%' }}
                  className="w-full text-left p-2 rounded text-text-on-color dark:text-slate-800 transition-all hover:opacity-90 active:cursor-grabbing cursor-grab shadow-sm"
                  title={`Lesson: ${student?.name} with ${instructor?.name} • R${lesson.roomId}\n${startLabel}–${endLabel}${hasNote ? `\nHas note` : ''}\nDouble-click to edit.`}
                  aria-label={`Lesson for ${student?.name} with ${instructor?.name} in Room ${lesson.roomId} from ${startLabel} to ${endLabel}${hasNote ? '. This lesson has a note.' : ''} Double click to edit.`}
                  draggable="true"
                  onDragStart={(e) => onLessonDragStart(e, lesson)}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="font-bold text-sm truncate">{student?.name}</div>
                    {hasNote && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                    )}
                  </div>
                  <div className="text-xs opacity-80 truncate">{instructor?.name} • R{lesson.roomId}</div>
                  <div className="text-[10px] opacity-90 mt-1">{startLabel}–{endLabel}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
