import React, { useEffect, useMemo, useState } from 'react';
import type { Lesson, Student, Instructor } from '../types';
import { TIME_SLOTS, DAYS_OF_WEEK_SHORT, toYYYYMMDD, LUNCH_BREAK_TIME } from '../constants';
import { addMinutes, roundToQuarter, toMinutes, toHHMM, to12Hour } from '../utils/time';

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

// Shared time constants
const DAY_START = TIME_SLOTS[0];
const DAY_END = addMinutes(TIME_SLOTS[TIME_SLOTS.length - 1], 60);
const startMin = toMinutes(DAY_START);
const endMin = toMinutes(DAY_END);
const totalMin = endMin - startMin;
const PX_PER_MIN = 2; // 120px per hour
const HOUR_HEIGHT = 60 * PX_PER_MIN;

type Placed = Lesson & { _lane: number; _lanes: number; _top: number; _height: number };

function placeLessonsForDay(lessonsForDay: Lesson[]): Placed[] {
  const events = lessonsForDay
    .map(l => {
      const s = Math.max(startMin, toMinutes(l.time));
      const e = Math.min(endMin, toMinutes(l.endTime || addMinutes(l.time, 60)));
      return { l, s, e };
    })
    .filter(x => x.e > x.s)
    .sort((a, b) => a.s - b.s);

  const results: Placed[] = [];
  let group: { l: Lesson; s: number; e: number }[] = [];
  let groupEnd = -1;

  const flushGroup = () => {
    if (group.length === 0) return;
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
}

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
  const [dragGuide, setDragGuide] = useState<null | { top: number; height: number; label: string; dateKey: string }>(null);
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, i])), [instructors]);

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const dates: Date[] = [];
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

  const lessonsForWeek = useMemo(
    () => lessons.filter(l => weekDates.some(d => toYYYYMMDD(d) === l.date)),
    [lessons, weekDates]
  );

  // Precompute placed lessons per day
  const placedByDate = useMemo(() => {
    const map = new Map<string, Placed[]>();
    for (const d of weekDates) {
      const dateStr = toYYYYMMDD(d);
      const forDay = lessonsForWeek.filter(l => l.date === dateStr);
      map.set(dateStr, placeLessonsForDay(forDay));
    }
    return map;
  }, [lessonsForWeek, weekDates]);

  const today = new Date();

  const handleColumnDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const lessonId = e.dataTransfer.getData('lessonId');
    if (!lessonId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = Math.min(Math.max(e.clientY - rect.top, 0), totalMin * PX_PER_MIN);
    const minutesFromStart = Math.round(y / PX_PER_MIN);
    const proposed = toHHMM(startMin + minutesFromStart);
  const snapped = roundToQuarter(proposed);
  onUpdateLessonPosition(lessonId, date, snapped, e.altKey);
  setDragGuide(null);
  };

  const handleColumnDoubleClick = (e: React.MouseEvent, date: Date) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = Math.min(Math.max(e.clientY - rect.top, 0), totalMin * PX_PER_MIN);
    const minutesFromStart = Math.round(y / PX_PER_MIN);
    const proposed = toHHMM(startMin + minutesFromStart);
  const snapped = roundToQuarter(proposed);
    onAddLesson(date, snapped);
  };

  const handleColumnDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = Math.min(Math.max(e.clientY - rect.top, 0), totalMin * PX_PER_MIN);
    const minutesFromStart = Math.round(y / PX_PER_MIN);
    const proposed = toHHMM(startMin + minutesFromStart);
    const snapped = roundToQuarter(proposed);
    const lessonId = e.dataTransfer.getData('lessonId');
    const original = lessons.find(l => l.id === lessonId);
    const durationMin = original ? (toMinutes(original.endTime || addMinutes(original.time, 60)) - toMinutes(original.time)) : 60;
    const height = Math.max(20, durationMin * PX_PER_MIN);
    let top = (toMinutes(snapped) - startMin) * PX_PER_MIN;
    const maxTop = totalMin * PX_PER_MIN - height;
    top = Math.max(0, Math.min(top, maxTop));
    const endSnap = toHHMM(Math.min(endMin, toMinutes(snapped) + durationMin));
    setDragGuide({ top, height, label: `${snapped}–${endSnap}`, dateKey: toYYYYMMDD(date) });
  };

  const handleColumnDragLeave = () => setDragGuide(null);

  // Mobile: single-day tab using absolute layout
  const activeDate = weekDates[activeDayIndex];
  const placedActive = placedByDate.get(toYYYYMMDD(activeDate)) || [];

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
        {/* Absolute day canvas */}
        <div className="grid grid-cols-[64px_1fr]">
          <div className="relative" style={{ height: totalMin * PX_PER_MIN }}>
            {TIME_SLOTS.map((t, i) => (
              <div key={t} className="absolute left-0 right-0 px-2 text-right text-xs text-text-secondary dark:text-slate-400" style={{ top: i * HOUR_HEIGHT }}>
                {to12Hour(t)}
              </div>
            ))}
            {/* Now line (mobile time column) */}
            {(() => {
              const nowMin = now.getHours() * 60 + now.getMinutes();
              if (nowMin >= startMin && nowMin <= endMin && activeDate.toDateString() === new Date().toDateString()) {
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
          <div
            className="relative border-l border-surface-border dark:border-slate-700"
            style={{ height: totalMin * PX_PER_MIN }}
            onDragOver={(e) => handleColumnDragOver(e, activeDate)}
            onDrop={(e) => handleColumnDrop(e, activeDate)}
            onDragLeave={handleColumnDragLeave}
            onDoubleClick={(e) => handleColumnDoubleClick(e, activeDate)}
          >
            {/* Now line (mobile day canvas) */}
            {(() => {
              const nowMin = now.getHours() * 60 + now.getMinutes();
              if (nowMin >= startMin && nowMin <= endMin && activeDate.toDateString() === new Date().toDateString()) {
                const top = (nowMin - startMin) * PX_PER_MIN;
                return (
                  <div className="absolute left-0 right-0 z-10" style={{ top }}>
                    <div className="h-px bg-brand-primary" />
                    <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-brand-primary" />
                  </div>
                );
              }
              return null;
            })()}
            {/* Drag guide preview (mobile) */}
            {dragGuide && dragGuide.dateKey === toYYYYMMDD(activeDate) && (
              <div className="absolute left-0 right-0 pointer-events-none" style={{ top: dragGuide.top, height: dragGuide.height }}>
                <div className="absolute inset-0 border-2 border-dashed border-brand-primary/70 bg-brand-primary/10 rounded-sm" />
                <div className="absolute -left-1 -top-5 bg-brand-primary text-text-on-color text-[10px] px-1 py-0.5 rounded shadow-sm">
                  {dragGuide.label}
                </div>
              </div>
            )}
            {TIME_SLOTS.map((t, i) => (
              <div key={t} className="absolute left-0 right-0 border-t border-surface-border/60 dark:border-slate-700/60" style={{ top: i * HOUR_HEIGHT }} />
            ))}
            {(() => {
              const l = toMinutes(LUNCH_BREAK_TIME);
              if (l >= startMin && l < endMin) {
                const top = (l - startMin) * PX_PER_MIN;
                return <div className="absolute left-0 right-0 bg-surface-input/50 dark:bg-slate-700/50" style={{ top, height: HOUR_HEIGHT }} />;
              }
              return null;
            })()}
            {placedActive.map(lesson => {
              const student = studentMap.get(lesson.studentId);
              const instructor = instructorMap.get(lesson.instructorId);
              const hasNote = lesson.notes && lesson.notes.trim() !== '';
              // Horizontal lanes with tight 2px gap to better show real time overlap
              const GAP = 2;
              const width = `calc((100% - ${(lesson._lanes - 1) * GAP}px) / ${lesson._lanes})`;
              const left = `calc(${lesson._lane} * (100% / ${lesson._lanes}) + ${lesson._lane * GAP}px)`;
              const startLabel = to12Hour(lesson.time);
              const endLabel = to12Hour(lesson.endTime || addMinutes(lesson.time, 60));
              const cardH = Math.max(30, lesson._height);
              const compact = cardH < 42;
              return (
                <div key={lesson.id} className="absolute p-1 z-20" style={{ top: lesson._top, left, width, height: cardH }}>
                  <button
                    onDoubleClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                    style={{ backgroundColor: instructor?.color, height: '100%' }}
                    className="relative w-full h-full text-left pl-3 pr-2 py-1 rounded text-text-on-color dark:text-slate-800 text-[11px] leading-tight transition-all hover:opacity-90 active:cursor-grabbing cursor-grab shadow-md overflow-hidden"
                    title={`Lesson: ${student?.name} with ${instructor?.name} • R${lesson.roomId}\n${startLabel}–${endLabel}${hasNote ? `\nHas note` : ''}\nDouble-click to edit.`}
                    aria-label={`Lesson for ${student?.name} with ${instructor?.name} in Room ${lesson.roomId} from ${startLabel} to ${endLabel}${hasNote ? '. This lesson has a note.' : ''} Double click to edit.`}
                    draggable="true"
                    onDragStart={(e) => onLessonDragStart(e, lesson)}
                  >
                    {/* left accent stripe with subtle diagonal hatch */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style={{ background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.35), rgba(255,255,255,0.35) 2px, transparent 2px, transparent 4px)' }} />
                    {compact ? (
                      <>
                        <div className="flex items-start justify-between">
                          <span className="font-semibold truncate mr-2">{student?.name}</span>
                          {hasNote && <NoteIcon />}
                        </div>
                        <div className="text-[10px] opacity-90 truncate">R{lesson.roomId} • {startLabel}–{endLabel}</div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <span className="font-semibold mr-2">{startLabel}</span>
                          {hasNote && <NoteIcon />}
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

      {/* Desktop Grid View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="grid grid-cols-[auto_repeat(7,minmax(180px,1fr))] min-w-[1100px]">
          {/* Header: Time spacer */}
          <div className="text-xs p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 sticky left-0 top-0 z-30 text-text-secondary dark:text-slate-400">Time</div>

          {/* Header: Day labels */}
          {weekDates.map((date) => (
            <div key={date.toISOString()} className={`p-2 text-center border-b border-r border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800 sticky top-0 z-10 ${[0,6].includes(date.getDay()) ? 'bg-surface-header dark:bg-slate-800' : ''}`}>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs sm:text-sm text-text-secondary dark:text-slate-400">{DAYS_OF_WEEK_SHORT[date.getDay()]}</span>
                <span className={`h-6 w-6 inline-flex items-center justify-center rounded-full text-xs font-semibold ${date.toDateString() === today.toDateString() ? 'bg-brand-primary text-text-on-color' : 'text-text-secondary dark:text-slate-400'}`}>{date.getDate()}</span>
              </div>
            </div>
          ))}

          {/* Body */}
          {/* Left time labels column */}
          <div className="relative border-r border-surface-border dark:border-slate-700" style={{ height: totalMin * PX_PER_MIN }}>
            {TIME_SLOTS.map((t, i) => (
              <div key={t} className="absolute left-0 right-0 px-2 text-right text-xs text-text-secondary dark:text-slate-400" style={{ top: i * HOUR_HEIGHT }}>
                {to12Hour(t)}
              </div>
            ))}
            {/* Now line (desktop time column) */}
            {(() => {
              const nowMin = now.getHours() * 60 + now.getMinutes();
              if (nowMin >= startMin && nowMin <= endMin) {
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

          {/* Seven day columns */}
          {weekDates.map(date => {
            const dateStr = toYYYYMMDD(date);
            const placed = placedByDate.get(dateStr) || [];

            return (
              <div key={date.toISOString()} className="relative border-r border-surface-border dark:border-slate-700" style={{ height: totalMin * PX_PER_MIN }}>
                <div
                  className="absolute inset-0"
                  onDragOver={(e) => handleColumnDragOver(e, date)}
                  onDrop={(e) => handleColumnDrop(e, date)}
                  onDragLeave={handleColumnDragLeave}
                  onDoubleClick={(e) => handleColumnDoubleClick(e, date)}
                >
                  {/* Weekend subtle shading */}
                  {[0,6].includes(date.getDay()) && (
                    <div className="absolute inset-0 bg-surface-hover/40 dark:bg-slate-700/20 pointer-events-none" />
                  )}
                  {/* Now line (desktop day column) */}
                  {(() => {
                    const nowMin = now.getHours() * 60 + now.getMinutes();
                    if (date.toDateString() === new Date().toDateString() && nowMin >= startMin && nowMin <= endMin) {
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
                  {/* Drag guide preview (desktop) */}
                  {dragGuide && dragGuide.dateKey === dateStr && (
                    <div className="absolute left-0 right-0 pointer-events-none" style={{ top: dragGuide.top, height: dragGuide.height }}>
                      <div className="absolute inset-0 border-2 border-dashed border-brand-primary/70 bg-brand-primary/10 rounded-sm" />
                      <div className="absolute -left-1 -top-5 bg-brand-primary text-text-on-color text-[10px] px-1 py-0.5 rounded shadow-sm">
                        {dragGuide.label}
                      </div>
                    </div>
                  )}
                  {/* Hour grid lines */}
                  {TIME_SLOTS.map((t, i) => (
                    <div key={t} className="absolute left-0 right-0 border-t border-surface-border/60 dark:border-slate-700/60 z-0" style={{ top: i * HOUR_HEIGHT }} />
                  ))}
                  {/* Quick add buttons each hour */}
                  {TIME_SLOTS.map((t, i) => (
                    <button
                      key={`add-${date.toISOString()}-${t}`}
                      onClick={(e) => { e.stopPropagation(); onAddLesson(date, t); }}
                      className="absolute right-1 z-10 p-1 rounded-full text-text-tertiary dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
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
                  {placed.map(lesson => {
                    const student = studentMap.get(lesson.studentId);
                    const instructor = instructorMap.get(lesson.instructorId);
                    const hasNote = lesson.notes && lesson.notes.trim() !== '';
                    // Horizontal lanes with tight 2px gap between lanes
                    const GAP = 2;
                    const width = `calc((100% - ${(lesson._lanes - 1) * GAP}px) / ${lesson._lanes})`;
                    const left = `calc(${lesson._lane} * (100% / ${lesson._lanes}) + ${lesson._lane * GAP}px)`;
        const startLabel = to12Hour(lesson.time);
        const endLabel = to12Hour(lesson.endTime || addMinutes(lesson.time, 60));
        const cardH = Math.max(18, lesson._height);
        const compact = cardH < 42;
        return (
            <div key={lesson.id} className="absolute p-1 z-20" style={{ top: lesson._top, left, width, height: cardH }}>
                        <button
                          onDoubleClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                          style={{ backgroundColor: instructor?.color, height: '100%' }}
              className="relative w-full h-full text-left pl-3 pr-2 py-1 rounded text-text-on-color dark:text-slate-800 text-[11px] leading-tight transition-all hover:opacity-90 active:cursor-grabbing cursor-grab shadow-md overflow-hidden"
                          title={`Lesson: ${student?.name} with ${instructor?.name} • R${lesson.roomId}\n${startLabel}–${endLabel}${hasNote ? `\nHas note` : ''}\nDouble-click to edit.`}
                          aria-label={`Lesson for ${student?.name} with ${instructor?.name} in Room ${lesson.roomId} from ${startLabel} to ${endLabel}${hasNote ? '. This lesson has a note.' : ''} Double click to edit.`}
                          draggable="true"
                          onDragStart={(e) => onLessonDragStart(e, lesson)}
                        >
                          {/* left accent stripe */}
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style={{ background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.35), rgba(255,255,255,0.35) 2px, transparent 2px, transparent 4px)' }} />
                          {compact ? (
                            <>
                              <div className="flex items-start justify-between">
                                <span className="font-semibold truncate mr-2">{student?.name}</span>
                                {hasNote && <NoteIcon />}
                              </div>
                              <div className="text-[10px] opacity-90 truncate">R{lesson.roomId} • {startLabel}–{endLabel}</div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-start justify-between">
                                <span className="font-semibold mr-2">{startLabel}</span>
                                {hasNote && <NoteIcon />}
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
            );
          })}
        </div>
      </div>
    </div>
  );
};