import React from 'react';
import { TrashPage } from '../components/TrashPage';
import { useApp } from '../context/AppContext.supabase';

export const TrashPageWrapper: React.FC = () => {
  const { deletedLessons, students, instructors, handleRequestAdminAction, handleRestoreLesson } = useApp();
  return (
    <TrashPage
      deletedLessons={deletedLessons}
      students={students}
      instructors={instructors}
      onRestore={handleRestoreLesson}
      onDeletePermanently={(lessonId) => handleRequestAdminAction({ type: 'deleteLessonPermanently', lessonId })}
    />
  );
};
