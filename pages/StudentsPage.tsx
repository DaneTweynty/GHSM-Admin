import React from 'react';
import { StudentsList } from '../components/StudentsList';
import { useApp } from '../context/AppContext';
import type { Student } from '../types';

export const StudentsPage: React.FC = () => {
  const { 
    students, 
    instructors, 
    activeLessons, 
    billings, 
    handleMarkAttendance, 
    handleToggleStudentStatus, 
    handleOpenEditSessionModal
    // handleOpenEnrollmentModal,
    // handleBulkAddStudents
  } = useApp();
  
  const handleAddStudent = () => {
    // TODO: Implement add student functionality
    console.log('Add student clicked');
  };

  const handleBulkAdd = async (students: Partial<Student>[]) => {
    // TODO: Implement bulk add functionality
    console.log('Bulk add students:', students);
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
      onBatchEnrollment={handleBulkAdd}
    />
  );
};
