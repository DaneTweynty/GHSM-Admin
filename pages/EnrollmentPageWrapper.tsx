import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnrollmentPage } from '../components/EnrollmentPage';
import { useApp } from '../context/AppContext.supabase';
import { ROUTES } from '../constants/routes';

export const EnrollmentPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { activeInstructors, students, handleRequestEnrollment, enrollmentSuccessMessage } = useApp();
  
  // Navigate to students page after successful enrollment
  useEffect(() => {
    if (enrollmentSuccessMessage) {
      const timer = setTimeout(() => {
        navigate(ROUTES.STUDENTS);
      }, 2000); // Give user time to see the success message
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [enrollmentSuccessMessage, navigate]);
  
  return (
    <EnrollmentPage
      instructors={activeInstructors}
      students={students}
      onRequestEnrollment={handleRequestEnrollment}
      successMessage={enrollmentSuccessMessage}
    />
  );
};
