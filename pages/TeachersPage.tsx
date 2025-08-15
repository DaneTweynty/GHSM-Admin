import React from 'react';
import { TeachersList } from '../components/TeachersList';
import { useStudents, useInstructors, useLessons } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext.supabase';
import { mapLessonsToUi } from '../utils/mappers';

export const TeachersPage: React.FC = () => {
  // Use proper Supabase queries instead of context
  const { data: instructors = [] } = useInstructors();
  const { data: students = [] } = useStudents();
  const { data: dbLessons = [] } = useLessons();
  
  // Convert database types to UI types
  const activeLessons = mapLessonsToUi(dbLessons);
  
  // Keep only UI state management from context
  const { handleMarkAttendance, handleOpenEditInstructorModal, handleRequestAdminAction, handleToggleInstructorStatus } = useApp();
  
  return (
    <TeachersList
      instructors={instructors}
      students={students}
      lessons={activeLessons}
      onMarkAttendance={handleMarkAttendance}
      onEditInstructor={handleOpenEditInstructorModal}
      onAddInstructor={() => handleRequestAdminAction({ type: 'addInstructor' })}
      onToggleInstructorStatus={handleToggleInstructorStatus}
    />
  );
};
