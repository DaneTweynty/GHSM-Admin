import React from 'react';
import { TeachersList } from '../components/TeachersList';
import { useApp } from '../context/AppContext';

export const TeachersPage: React.FC = () => {
  const { instructors, students, activeLessons, handleMarkAttendance, handleOpenEditInstructorModal, handleRequestAdminAction, handleToggleInstructorStatus } = useApp();
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
