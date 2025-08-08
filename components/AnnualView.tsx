

import React from 'react';
import { MONTH_NAMES, DAYS_OF_WEEK_SHORT } from '../constants';

interface AnnualViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

const MiniCalendar: React.FC<{ year: number; month: number; isSelected: boolean; today: Date, onSelect: () => void; }> = ({ year, month, isSelected, today, onSelect }) => {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const grid = [];
  // Add padding for previous month's days
  for (let i = 0; i < firstDayOfMonth; i++) {
    grid.push(<div key={`pad-prev-${i}`} className="text-center text-xs"></div>);
  }
  // Add current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
    grid.push(
        <div key={`day-${i}`} className="flex justify-center items-center">
            <span className={`text-center text-xs w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-primary text-text-on-color' : ''}`}>
                {i}
            </span>
        </div>
    );
  }

  return (
    <div 
        onClick={onSelect}
        className={`p-2 border rounded-lg cursor-pointer transition-colors duration-200 ${isSelected ? 'border-brand-primary dark:border-brand-secondary bg-brand-primary-light dark:bg-brand-primary/20' : 'border-surface-border dark:border-slate-700 hover:bg-surface-hover dark:hover:bg-slate-700'}`}
    >
      <h3 className={`font-bold text-center mb-2 ${isSelected ? 'text-brand-primary' : 'text-text-primary dark:text-slate-200'}`}>
        {MONTH_NAMES[month]}
      </h3>
      <div className="grid grid-cols-7 gap-y-1 text-text-secondary dark:text-slate-400">
        {DAYS_OF_WEEK_SHORT.map(day => <div key={day} className="text-center text-[10px] font-medium">{day[0]}</div>)}
        {grid}
      </div>
    </div>
  );
};

export const AnnualView: React.FC<AnnualViewProps> = ({ currentDate, onDateSelect }) => {
  const year = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();
  const today = new Date();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {MONTH_NAMES.map((_, monthIndex) => (
        <MiniCalendar
          key={monthIndex}
          year={year}
          month={monthIndex}
          isSelected={monthIndex === selectedMonth}
          today={today}
          onSelect={() => onDateSelect(new Date(year, monthIndex, 1))}
        />
      ))}
    </div>
  );
};