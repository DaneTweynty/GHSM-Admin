import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentsList } from '../components/StudentsList';
import { useStudents, useInstructors, useLessons, useBillings } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext.supabase';
import { ROUTES } from '../constants/routes';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ICONS } from '../constants';
import { mapLessonsToUi, mapBillingsToUi } from '../utils/mappers';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Use proper Supabase queries instead of context
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useStudents();
  const { data: instructors = [], isLoading: instructorsLoading } = useInstructors();
  const { data: dbLessons = [], isLoading: lessonsLoading } = useLessons();
  const { data: dbBillings = [], isLoading: billingsLoading } = useBillings();
  
  // Convert database types to UI types (services already convert students & instructors)
  const lessons = mapLessonsToUi(dbLessons);
  
  // Create student name lookup for billings
  const studentNameMap = students.reduce((acc, student) => {
    acc[student.id] = student.name;
    return acc;
  }, {} as Record<string, string>);
  
  const billings = mapBillingsToUi(dbBillings, studentNameMap);
  
  // Keep only UI state management from context
  const { 
    handleMarkAttendance, 
    handleToggleStudentStatus, 
    handleOpenEditSessionModal,
    handleBulkEnrollStudents
  } = useApp();
  
  // Loading state
  const isLoading = studentsLoading || instructorsLoading || lessonsLoading || billingsLoading;
  
  // Error state
  if (studentsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-status-red mb-2">
            {React.cloneElement(ICONS.users, { className: 'h-8 w-8 mx-auto' })}
          </div>
          <p className="text-text-primary font-medium">Failed to load students</p>
          <p className="text-text-secondary text-sm mt-1">
            {studentsError instanceof Error ? studentsError.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-text-secondary">Loading students...</span>
      </div>
    );
  }
  
  const handleAddStudent = () => {
    // Navigate to enrollment page using router
    navigate(ROUTES.ENROLLMENT);
  };
  
  return (
    <StudentsList
      students={students}
      instructors={instructors}
      lessons={lessons}
      billings={billings}
      onMarkAttendance={handleMarkAttendance}
      onToggleStatus={handleToggleStudentStatus}
      onEditSessions={handleOpenEditSessionModal}
      onAddStudent={handleAddStudent}
      onBatchEnrollment={handleBulkEnrollStudents}
    />
  );
};
