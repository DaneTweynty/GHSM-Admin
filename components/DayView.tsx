import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Lesson, Student, Instructor } from '../types';
import { DAYS_OF_WEEK_FULL, TIME_SLOTS, toYYYYMMDD, LUNCH_BREAK_TIME } from '../constants';
import { addMinutes, roundToQuarter, toMinutes, toHHMM, to12Hour } from '../utils/time';

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
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
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
  // Return original lane-based positions (side-by-side overlap)
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
  setDragGuide({ top, height, label: `${to12Hour(snapped)}–${to12Hour(endSnap)}` });
  };

  const handleBackgroundDragLeave = () => setDragGuide(null);

  const dayLabel = dayOfWeek;

  return (
    <div className="border border-surface-border dark:border-slate-700 rounded-md overflow-hidden bg-surface-card dark:bg-slate-800">
      {/* Header */}
      <div className="grid grid-cols-[64px_1fr]">
        <div className="p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 text-xs text-text-secondary dark:text-slate-400">Time</div>
        <div className="p-2 text-center border-b border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs sm:text-sm text-text-secondary dark:text-slate-400">{dayLabel}</span>
            <span className={`h-6 w-6 inline-flex items-center justify-center rounded-full text-xs font-semibold ${new Date().toDateString() === currentDate.toDateString() ? 'bg-brand-primary text-text-on-color' : 'text-text-secondary dark:text-slate-400'}`}>{currentDate.getDate()}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[64px_1fr]">
        {/* Left time column */}
        <div className="relative" style={{ height: totalMin * PX_PER_MIN }}>
          {TIME_SLOTS.map((t, i) => (
            <div key={t} className="absolute left-0 right-0 px-2 text-right text-xs text-text-secondary dark:text-slate-400" style={{ top: i * HOUR_HEIGHT }}>
              {to12Hour(t)}
            </div>
          ))}
          {/* Now line on time column */}
          {(() => {
            const nowMin = now.getHours() * 60 + now.getMinutes();
            if (nowMin >= startMin && nowMin <= endMin && new Date().toDateString() === currentDate.toDateString()) {
              const top = (nowMin - startMin) * PX_PER_MIN;
              return (
                <div className="absolute left-0 right-0" style={{ top }}>
                  <div className="h-px bg-brand-primary/70" />
                </div>
              );
            }
            return null;
          })()}
        </div>
        {/* Right canvas */}
  <div className="relative border-l border-surface-border dark:border-slate-700" style={{ height: totalMin * PX_PER_MIN }}
       ref={canvasRef}
       onDragOver={handleBackgroundDragOver}
             onDrop={handleBackgroundDrop}
       onDragLeave={handleBackgroundDragLeave}
             onDoubleClick={handleBackgroundDblClick}
        >
          {/* Now line */}
          {(() => {
            const nowMin = now.getHours() * 60 + now.getMinutes();
            if (nowMin >= startMin && nowMin <= endMin && new Date().toDateString() === currentDate.toDateString()) {
              const top = (nowMin - startMin) * PX_PER_MIN;
              return (
                <div className="absolute left-0 right-0 z-20" style={{ top }}>
                  <div className="h-px bg-brand-primary" />
                  <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-brand-primary" />
                </div>
              );
            }
            return null;
          })()}
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
          
          {/* Quarter-hour grid lines for better time indication */}
          {TIME_SLOTS.flatMap((t, i) => [1, 2, 3].map(quarter => (
            <div key={`${t}-${quarter}`} className="absolute left-0 right-0 border-t border-surface-border/20 dark:border-slate-700/20" style={{ top: i * HOUR_HEIGHT + quarter * (HOUR_HEIGHT / 4) }} />
          )))}

          {/* Quick add buttons at each hour - positioned in dedicated column */}
          <div className="absolute right-0 top-0 bottom-0 w-14 bg-surface-card/30 dark:bg-slate-800/30 border-l border-surface-border/30 dark:border-slate-700/30">
            {TIME_SLOTS.map((t, i) => {
              // Check if there are lessons overlapping this time slot
              const hasOverlappingLesson = placedLessons.some(lesson => {
                const lessonTop = lesson._top;
                const lessonBottom = lessonTop + lesson._height;
                const slotTop = i * HOUR_HEIGHT;
                const slotBottom = slotTop + HOUR_HEIGHT;
                return lessonTop < slotBottom && lessonBottom > slotTop;
              });
              
              return (
                <button
                  key={`add-${t}`}
                  onClick={(e) => { e.stopPropagation(); onAddLesson(currentDate, t); }}
                  className={`absolute left-1/2 transform -translate-x-1/2 z-30 p-1.5 rounded-full text-text-secondary dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors shadow-sm ${
                    hasOverlappingLesson 
                      ? 'bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-600' 
                      : 'hover:shadow-md'
                  }`}
                  style={{ top: i * HOUR_HEIGHT + 4 }}
                  title={`Add lesson at ${to12Hour(t)}`}
                  aria-label={`Add lesson at ${to12Hour(t)}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
                  </svg>
                </button>
              );
            })}
          </div>

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
            // Horizontal lanes with tight 2px gap between lanes
            const GAP = 2;
            const BUTTON_COLUMN_WIDTH = 56; // 56px for button column to prevent overlap
            const LESSON_AREA_WIDTH = `calc(100% - ${BUTTON_COLUMN_WIDTH}px - 8px)`; // Additional 8px margin
            const laneWidth = `calc((${LESSON_AREA_WIDTH} - ${(lesson._lanes - 1) * GAP}px) / ${lesson._lanes})`;
            const width = laneWidth;
            const left = `calc(${lesson._lane} * (${laneWidth}) + ${lesson._lane * GAP}px + 4px)`; // 4px left margin
            const startLabel = to12Hour(lesson.time);
            const endLabel = to12Hour(lesson.endTime || addMinutes(lesson.time, 60));
            const cardH = Math.max(30, lesson._height);
            const compact = cardH < 42;
            return (
              <div key={lesson.id}
                   className="absolute p-1 z-20"
                   style={{ top: lesson._top, left, width, height: cardH }}
              >
                <button
                  onDoubleClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                  onMouseDown={(e) => {
                    // Allow drag to start properly
                    if (e.detail === 1) { // Single click
                      e.currentTarget.setAttribute('data-allow-drag', 'true');
                    }
                  }}
                  style={{ backgroundColor: instructor?.color || '#6B7280', height: '100%' }}
                  className="relative w-full h-full text-left pl-3 pr-2 py-1 rounded text-text-on-color dark:text-slate-800 text-sm leading-tight transition-all hover:opacity-90 active:cursor-grabbing cursor-grab shadow-md overflow-hidden"
                  title={`Lesson: ${student?.name} with ${instructor?.name} • R${lesson.roomId}\n${startLabel}–${endLabel}${hasNote ? `\nHas note` : ''}\nDrag to move • Double-click to edit`}
                  aria-label={`Lesson for ${student?.name} with ${instructor?.name} in Room ${lesson.roomId} from ${startLabel} to ${endLabel}${hasNote ? '. This lesson has a note.' : ''} Drag to move or double click to edit.`}
                  draggable="true"
                  onDragStart={(e) => {
                    e.currentTarget.style.opacity = '0.5';
                    onLessonDragStart(e, lesson);
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {/* left accent stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style={{ background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.35), rgba(255,255,255,0.35) 2px, transparent 2px, transparent 4px)' }} />
                  {compact ? (
                    <>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold truncate mr-2">{student?.name}</span>
                        {hasNote && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        )}
                      </div>
                      <div className="text-xs opacity-90 truncate">R{lesson.roomId} • {startLabel}–{endLabel}</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold mr-2">{startLabel}</span>
                        {hasNote && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        )}
                      </div>
                      <div className="truncate">{student?.name}</div>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
