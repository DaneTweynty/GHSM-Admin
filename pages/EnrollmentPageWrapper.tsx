import React from 'react';
import { EnrollmentPage } from '../components/EnrollmentPage';
import { useApp } from '../context/AppContext';

export const EnrollmentPageWrapper: React.FC = () => {
  const { activeInstructors, students, handleRequestEnrollment, enrollmentSuccessMessage } = useApp();
  return (
    <EnrollmentPage
      instructors={activeInstructors}
      students={students}
      onRequestEnrollment={handleRequestEnrollment}
      successMessage={enrollmentSuccessMessage}
    />
  );
};
