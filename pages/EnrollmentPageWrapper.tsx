import React from 'react';
import { EnrollmentPage } from '../components/EnrollmentPage';
import { useApp } from '../context/AppContext';

export const EnrollmentPageWrapper: React.FC = () => {
  const { activeInstructors, handleRequestEnrollment, enrollmentSuccessMessage } = useApp();
  return (
    <EnrollmentPage
      instructors={activeInstructors}
      onRequestEnrollment={handleRequestEnrollment}
      successMessage={enrollmentSuccessMessage}
    />
  );
};
