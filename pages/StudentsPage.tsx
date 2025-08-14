import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentsList } from '../components/StudentsList';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../constants/routes';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    students, 
    instructors, 
    activeLessons, 
    billings, 
    handleMarkAttendance, 
    handleToggleStudentStatus, 
    handleOpenEditSessionModal,
    handleBulkEnrollStudents
  } = useApp();
  
  const handleAddStudent = () => {
    // Navigate to enrollment page using router
    navigate(ROUTES.ENROLLMENT);
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
