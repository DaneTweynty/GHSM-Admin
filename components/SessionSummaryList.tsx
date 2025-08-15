// @ts-nocheck
import React from 'react';
import { Card } from './Card';
import { useSessionSummariesByStudent, useSessionSummariesByInstructor } from '../hooks/useSupabase';
import { formatDistanceToNow } from 'date-fns';
import { sanitizeText, sanitizeStringArray, truncateText } from '../utils/securityUtils';

interface SessionSummaryListProps {
  studentId?: string;
  instructorId?: string;
  limit?: number;
}

export const SessionSummaryList: React.FC<SessionSummaryListProps> = ({
  studentId,
  instructorId,
  limit = 10,
}) => {
  const { data: studentSummaries, isLoading: isLoadingStudent } = useSessionSummariesByStudent(
    studentId || '',
    limit
  );
  const { data: instructorSummaries, isLoading: isLoadingInstructor } = useSessionSummariesByInstructor(
    instructorId || '',
    limit
  );

  const summaries = studentId ? studentSummaries : instructorSummaries;
  const isLoading = studentId ? isLoadingStudent : isLoadingInstructor;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No session summaries found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {summaries.map((summary) => (
        <Card key={summary.id} className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg">
                {summary.lessons?.title || 'Lesson'}
              </h3>
              <p className="text-sm text-gray-600">
                {summary.lessons?.start_time && 
                  new Date(summary.lessons.start_time).toLocaleDateString()
                }
                {/* @ts-ignore */}
                {studentId && summary.instructors?.name && (
                  <span> • Instructor: {summary.instructors.name}</span>
                )}
                {/* @ts-ignore */}
                {instructorId && summary.lessons?.students?.name && (
                  <span> • Student: {summary.lessons.students.name}</span>
                )}
              </p>
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(summary.submitted_at), { addSuffix: true })}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-gray-800">{truncateText(summary.summary_text, 300)}</p>
            </div>

            {summary.topics_covered && summary.topics_covered.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Topics Covered:</p>
                <div className="flex flex-wrap gap-1">
                  {sanitizeStringArray(summary.topics_covered).map((topic: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {summary.homework_assigned && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Homework:</p>
                <p className="text-sm text-gray-600">{sanitizeText(summary.homework_assigned)}</p>
              </div>
            )}

            {summary.student_progress && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Progress Notes:</p>
                <p className="text-sm text-gray-600">{sanitizeText(summary.student_progress)}</p>
              </div>
            )}

            {summary.next_lesson_focus && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Next Lesson Focus:</p>
                <p className="text-sm text-gray-600">{sanitizeText(summary.next_lesson_focus)}</p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
