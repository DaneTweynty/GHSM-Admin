import React from 'react';
import { StudentsList } from '../components/StudentsList';
import { useApp } from '../context/AppContext';

export const StudentsPage: React.FC = () => {
  const { 
    students, 
    instructors, 
    activeLessons, 
    billings, 
    handleMarkAttendance, 
    handleToggleStudentStatus, 
    handleOpenEditSessionModal,
    handleBulkEnrollStudents,
    setView
  } = useApp();
  
  const handleAddStudent = () => {
    // Navigate to enrollment page
    setView('enrollment');
  };
  
  return (
    <StudentsList
      students={students}
      instructors={instructors}
      lessons={activeLessons}
      billings={billings}
      onMarkAttendance={handleMarkAttendance}
      onToggleStatus={handleToggleStudentStatus}
      onEditSessions={handleOpenEditSessionModal}
      onAddStudent={handleAddStudent}
      onBatchEnrollment={handleBulkEnrollStudents}
    />
  );
};
