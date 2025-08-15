import React, { useState } from 'react';
import { Card } from './Card';
import { useCreateSessionSummary, useUpdateSessionSummary, useSessionSummaryByLesson } from '../hooks/useSupabase';
import { sanitizeText, sanitizeStringArray } from '../utils/securityUtils';
import type { Database } from '../utils/database.types';

type Tables = Database['public']['Tables'];

interface SessionSummaryFormProps {
  lessonId: string;
  instructorId: string;
  onClose: () => void;
}

export const SessionSummaryForm: React.FC<SessionSummaryFormProps> = ({
  lessonId,
  instructorId,
  onClose,
}) => {
  const { data: existingSummary } = useSessionSummaryByLesson(lessonId);
  const createSummary = useCreateSessionSummary();
  const updateSummary = useUpdateSessionSummary();

  const [formData, setFormData] = useState({
    summary_text: existingSummary?.summary_text || '',
    topics_covered: existingSummary?.topics_covered?.join(', ') || '',
    homework_assigned: existingSummary?.homework_assigned || '',
    student_progress: existingSummary?.student_progress || '',
    next_lesson_focus: existingSummary?.next_lesson_focus || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const summaryData: Tables['session_summaries']['Insert'] = {
        lesson_id: lessonId,
        instructor_id: instructorId,
        summary_text: sanitizeText(formData.summary_text),
        topics_covered: sanitizeStringArray(
          formData.topics_covered
            .split(',')
            .map((topic: string) => topic.trim())
            .filter((topic: string) => topic.length > 0)
        ),
        homework_assigned: formData.homework_assigned ? sanitizeText(formData.homework_assigned) : null,
        student_progress: formData.student_progress ? sanitizeText(formData.student_progress) : null,
        next_lesson_focus: formData.next_lesson_focus ? sanitizeText(formData.next_lesson_focus) : null,
        submitted_at: new Date().toISOString(),
      };

      if (existingSummary) {
        await updateSummary.mutateAsync({
          id: existingSummary.id,
          updates: summaryData,
        });
      } else {
        await createSummary.mutateAsync(summaryData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save session summary:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {existingSummary ? 'Edit Session Summary' : 'Create Session Summary'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Session Summary *
              </label>
              <textarea
                value={formData.summary_text}
                onChange={(e) => handleChange('summary_text', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Provide a detailed summary of the lesson..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Topics Covered
              </label>
              <input
                type="text"
                value={formData.topics_covered}
                onChange={(e) => handleChange('topics_covered', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Topic 1, Topic 2, Topic 3..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate topics with commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Homework Assigned
              </label>
              <textarea
                value={formData.homework_assigned}
                onChange={(e) => handleChange('homework_assigned', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe any homework or practice assignments..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Student Progress
              </label>
              <textarea
                value={formData.student_progress}
                onChange={(e) => handleChange('student_progress', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Comment on student's progress, strengths, areas for improvement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Next Lesson Focus
              </label>
              <textarea
                value={formData.next_lesson_focus}
                onChange={(e) => handleChange('next_lesson_focus', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="What should be the focus for the next lesson?"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : existingSummary ? 'Update Summary' : 'Create Summary'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
