



import React from 'react';
import type { Lesson, Student, Instructor, CalendarView } from '../types';
import { MONTH_NAMES } from '../constants';
import { Card } from './Card';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AnnualView } from './AnnualView';

interface DashboardProps {
  lessons: Lesson[];
  students: Student[];
  instructors: Instructor[];
  currentDate: Date;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onEditLesson: (lesson: Lesson) => void;
  onAddLesson: (date: Date, time?: string) => void;
  onDateSelect: (date: Date) => void;
  onUpdateLessonPosition: (lessonId: string, newDate: Date, newTime: string | undefined, isCopy: boolean) => void;
  onLessonDragStart: (e: React.DragEvent, lesson: Lesson) => void;
}

const getHeaderText = (view: CalendarView, date: Date): string => {
    const monthName = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();

    switch(view) {
        case 'year':
            return `${year}`;
        case 'month': {
            return `${monthName} ${year}`;
        }
        case 'week': {
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                return `${monthName} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${year}`;
            } else {
                return `${MONTH_NAMES[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${MONTH_NAMES[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${year}`;
            }
        }
        case 'day': {
            return `${monthName} ${date.getDate()}, ${year}`;
        }
    }
}

export const Dashboard: React.FC<DashboardProps> = ({
  lessons,
  students,
  instructors,
  currentDate,
  view,
  setView,
  onNavigate,
  onEditLesson,
  onAddLesson,
  onDateSelect,
  onUpdateLessonPosition,
  onLessonDragStart,
}) => {
  const renderView = () => {
    const commonProps = { lessons, students, instructors, currentDate, onEditLesson, onUpdateLessonPosition, onLessonDragStart };
    switch (view) {
      case 'year':
        return <AnnualView currentDate={currentDate} onDateSelect={onDateSelect} />;
      case 'month':
        return <MonthView {...commonProps} onAddLesson={onAddLesson} />;
      case 'week':
        return <WeekView {...commonProps} onAddLesson={onAddLesson} />;
      case 'day':
        return <DayView {...commonProps} onAddLesson={onAddLesson} />;
      default:
        return null;
    }
  };

  const ViewButton = ({ label, value }: {label: string, value: CalendarView}) => (
    <button 
        onClick={() => setView(value)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === value ? 'bg-brand-primary text-text-on-color' : 'bg-surface-input dark:bg-slate-700 hover:bg-surface-hover dark:hover:bg-slate-600 text-text-primary dark:text-slate-200'}`}
    >
        {label}
    </button>
  );

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between w-full md:w-auto items-center">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary dark:text-slate-100 order-1">
            {getHeaderText(view, currentDate)}
          </h2>
          <div className="flex items-center order-2 md:order-3 md:ml-4">
            <button onClick={() => onNavigate('prev')} className="p-2 rounded-md hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors" aria-label="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => onNavigate('next')} className="p-2 rounded-md hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors" aria-label="Next">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 order-3 md:order-2 w-full md:w-auto justify-center">
            <div className="flex flex-grow justify-center space-x-1 bg-surface-header dark:bg-slate-900 p-1 rounded-lg">
                <ViewButton label="Year" value="year" />
                <ViewButton label="Month" value="month" />
                <ViewButton label="Week" value="week" />
                <ViewButton label="Day" value="day" />
            </div>
        </div>
      </div>
      
      <div>{renderView()}</div>

    </Card>
  );
};