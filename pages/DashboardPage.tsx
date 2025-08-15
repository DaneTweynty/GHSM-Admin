import React from 'react';
import { Dashboard } from '../components/Dashboard';
import { useStudents, useInstructors, useLessons } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext.supabase';
import { mapLessonsToUi } from '../utils/mappers';

export const DashboardPage: React.FC = () => {
  // Use proper Supabase queries instead of context
  const { data: students = [] } = useStudents();
  const { data: instructors = [] } = useInstructors();
  const { data: dbLessons = [] } = useLessons();
  
  // Convert database types to UI types
  const activeLessons = mapLessonsToUi(dbLessons);
  
  // Keep only UI state management from context
  const { currentDate, calendarView, setCalendarView, handleNavigate, handleOpenEditModal, handleOpenAddModal, handleDateSelect, handleUpdateLessonPosition, handleLessonDragStart } = useApp();
  
  return (
    <Dashboard
      lessons={activeLessons}
      students={students}
      instructors={instructors}
      currentDate={currentDate}
      view={calendarView}
      setView={setCalendarView}
      onNavigate={handleNavigate}
      onEditLesson={handleOpenEditModal}
      onAddLesson={handleOpenAddModal}
      onDateSelect={handleDateSelect}
      onUpdateLessonPosition={handleUpdateLessonPosition}
      onLessonDragStart={handleLessonDragStart}
    />
  );
};
