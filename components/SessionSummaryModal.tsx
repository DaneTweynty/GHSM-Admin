// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { X, FileText, Download, Calendar, Clock, User, Target, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import type { Lesson, Student, Instructor } from '../types';
import { useSessionSummaries, useCreateSessionSummary } from '../hooks/useSupabase';
import { useErrorHandler } from '../utils/errorHandling';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson?: Lesson;
  currentDate: Date;
  calendarView: 'day' | 'week' | 'month' | 'year';
  students: Student[];
  instructors: Instructor[];
  lessons: Lesson[];
}

interface SessionSummaryData {
  lessonId: string;
  studentId: string;
  instructorId: string;
  date: string;
  duration: number; // in minutes
  objectives: string;
  achievements: string;
  challenges: string;
  homework: string;
  nextLessonFocus: string;
  studentProgress: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  attendance: 'present' | 'absent' | 'late';
  notes: string;
  parentFeedback?: string;
}

interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalLessons: number;
  completedLessons: number;
  attendanceRate: number;
  averageProgress: string;
  keyAchievements: string[];
  upcomingGoals: string[];
}

interface MonthlySummary {
  monthStart: Date;
  monthEnd: Date;
  totalLessons: number;
  completedLessons: number;
  attendanceRate: number;
  progressTrend: 'improving' | 'stable' | 'declining';
  milestones: string[];
  recommendations: string[];
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  lesson,
  currentDate,
  calendarView,
  students,
  instructors,
  lessons
}) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'weekly' | 'monthly'>('individual');
  const [summaryData, setSummaryData] = useState<SessionSummaryData>({
    lessonId: lesson?.id || '',
    studentId: lesson?.studentId || '',
    instructorId: lesson?.instructorId || '',
    date: lesson?.date || format(currentDate, 'yyyy-MM-dd'),
    duration: lesson?.duration || 60,
    objectives: '',
    achievements: '',
    challenges: '',
    homework: '',
    nextLessonFocus: '',
    studentProgress: 'satisfactory',
    attendance: 'present',
    notes: '',
    parentFeedback: ''
  });

  const { reportError } = useErrorHandler();
  const createSessionSummaryMutation = useCreateSessionSummary();

  // Get session summaries for the period
  const sessionSummariesQuery = useSessionSummaries(
    lesson?.studentId || '',
    calendarView === 'week' ? format(startOfWeek(currentDate), 'yyyy-MM-dd') : 
    calendarView === 'month' ? format(startOfMonth(currentDate), 'yyyy-MM-dd') : 
    format(currentDate, 'yyyy-MM-dd'),
    calendarView === 'week' ? format(endOfWeek(currentDate), 'yyyy-MM-dd') : 
    calendarView === 'month' ? format(endOfMonth(currentDate), 'yyyy-MM-dd') : 
    format(currentDate, 'yyyy-MM-dd')
  );

  // Initialize form data when lesson changes
  useEffect(() => {
    if (lesson) {
      setSummaryData(prev => ({
        ...prev,
        lessonId: lesson.id,
        studentId: lesson.studentId,
        instructorId: lesson.instructorId,
        date: lesson.date,
        duration: lesson.duration || 60
      }));
    }
  }, [lesson]);

  // Find related data
  const student = useMemo(() => 
    students.find(s => s.id === summaryData.studentId),
    [students, summaryData.studentId]
  );

  const _instructor = useMemo(() => 
    instructors.find(i => i.id === summaryData.instructorId),
    [instructors, summaryData.instructorId]
  );

  // Calculate weekly summary
  const weeklySummary = useMemo((): WeeklySummary => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    
    const weekLessons = lessons.filter(l => {
      const lessonDate = new Date(l.date);
      return lessonDate >= weekStart && lessonDate <= weekEnd && l.studentId === summaryData.studentId;
    });

    const summaries = sessionSummariesQuery.data || [];
    const completedLessons = weekLessons.filter(l => 
      summaries.some(s => s.lesson_id === l.id)
    );

    const attendanceRate = weekLessons.length > 0 ? 
      (completedLessons.length / weekLessons.length) * 100 : 0;

    const progressLevels = summaries
      .filter(s => weekLessons.some(l => l.id === s.lesson_id))
      .map(s => s.student_progress);

    const averageProgress = progressLevels.length > 0 ? 
      progressLevels.reduce((acc, curr) => {
        const value = curr === 'excellent' ? 4 : curr === 'good' ? 3 : curr === 'satisfactory' ? 2 : 1;
        return acc + value;
      }, 0) / progressLevels.length : 2;

    const progressMap = { 1: 'needs_improvement', 2: 'satisfactory', 3: 'good', 4: 'excellent' };
    const averageLabel = progressMap[Math.round(averageProgress) as keyof typeof progressMap] || 'satisfactory';

    return {
      weekStart,
      weekEnd,
      totalLessons: weekLessons.length,
      completedLessons: completedLessons.length,
      attendanceRate,
      averageProgress: averageLabel,
      keyAchievements: summaries
        .filter(s => s.achievements)
        .map(s => s.achievements)
        .slice(0, 3),
      upcomingGoals: summaries
        .filter(s => s.next_lesson_focus)
        .map(s => s.next_lesson_focus)
        .slice(0, 3)
    };
  }, [currentDate, lessons, summaryData.studentId, sessionSummariesQuery.data]);

  // Calculate monthly summary
  const monthlySummary = useMemo((): MonthlySummary => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const monthLessons = lessons.filter(l => {
      const lessonDate = new Date(l.date);
      return lessonDate >= monthStart && lessonDate <= monthEnd && l.studentId === summaryData.studentId;
    });

    const summaries = sessionSummariesQuery.data || [];
    const completedLessons = monthLessons.filter(l => 
      summaries.some(s => s.lesson_id === l.id)
    );

    const attendanceRate = monthLessons.length > 0 ? 
      (completedLessons.length / monthLessons.length) * 100 : 0;

    // Determine progress trend
    const progressTrend: 'improving' | 'stable' | 'declining' = 'stable'; // Simplified

    return {
      monthStart,
      monthEnd,
      totalLessons: monthLessons.length,
      completedLessons: completedLessons.length,
      attendanceRate,
      progressTrend,
      milestones: summaries
        .filter(s => s.achievements && s.achievements.toLowerCase().includes('milestone'))
        .map(s => s.achievements)
        .slice(0, 5),
      recommendations: [
        'Continue practicing scales daily',
        'Focus on rhythm exercises',
        'Prepare for upcoming recital'
      ]
    };
  }, [currentDate, lessons, summaryData.studentId, sessionSummariesQuery.data]);

  const handleInputChange = (field: keyof SessionSummaryData, value: string) => {
    setSummaryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSummary = async () => {
    try {
      await createSessionSummaryMutation.mutateAsync({
        lesson_id: summaryData.lessonId,
        student_id: summaryData.studentId,
        instructor_id: summaryData.instructorId,
        date: summaryData.date,
        duration: summaryData.duration,
        objectives: summaryData.objectives,
        achievements: summaryData.achievements,
        challenges: summaryData.challenges,
        homework: summaryData.homework,
        next_lesson_focus: summaryData.nextLessonFocus,
        student_progress: summaryData.studentProgress,
        attendance: summaryData.attendance,
        notes: summaryData.notes,
        parent_feedback: summaryData.parentFeedback
      });

      onClose();
    } catch (error) {
      reportError(error as Error, { 
        category: 'supabase', 
        context: { action: 'createSessionSummary', lessonId: summaryData.lessonId } 
      });
    }
  };

  const handleExportPDF = () => {
    // Implementation for PDF export
    console.warn('PDF export functionality - placeholder implementation');
  };

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'satisfactory': return 'text-yellow-600 bg-yellow-100';
      case 'needs_improvement': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const _getProgressIcon = (progress: string) => {
    switch (progress) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'satisfactory': return <Clock className="w-4 h-4" />;
      case 'needs_improvement': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Session Summary
              </h2>
              {student && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {student.name} • {format(new Date(summaryData.date), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'individual', label: 'Individual Session', icon: User },
            { id: 'weekly', label: 'Weekly Summary', icon: Calendar },
            { id: 'monthly', label: 'Monthly Summary', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'individual' | 'weekly' | 'monthly')}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'individual' && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={summaryData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      value={summaryData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Attendance
                    </label>
                    <select
                      value={summaryData.attendance}
                      onChange={(e) => handleInputChange('attendance', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Progress
                    </label>
                    <select
                      value={summaryData.studentProgress}
                      onChange={(e) => handleInputChange('studentProgress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="satisfactory">Satisfactory</option>
                      <option value="needs_improvement">Needs Improvement</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lesson Objectives
                  </label>
                  <textarea
                    value={summaryData.objectives}
                    onChange={(e) => handleInputChange('objectives', e.target.value)}
                    placeholder="What were the goals for this lesson?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Achievements
                  </label>
                  <textarea
                    value={summaryData.achievements}
                    onChange={(e) => handleInputChange('achievements', e.target.value)}
                    placeholder="What did the student accomplish?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Challenges
                  </label>
                  <textarea
                    value={summaryData.challenges}
                    onChange={(e) => handleInputChange('challenges', e.target.value)}
                    placeholder="What areas need more work?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Homework
                  </label>
                  <textarea
                    value={summaryData.homework}
                    onChange={(e) => handleInputChange('homework', e.target.value)}
                    placeholder="Practice assignments for next lesson"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm h-24 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Next Lesson Focus
                </label>
                <textarea
                  value={summaryData.nextLessonFocus}
                  onChange={(e) => handleInputChange('nextLessonFocus', e.target.value)}
                  placeholder="What will be the focus of the next lesson?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={summaryData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional observations or notes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parent Feedback
                </label>
                <textarea
                  value={summaryData.parentFeedback}
                  onChange={(e) => handleInputChange('parentFeedback', e.target.value)}
                  placeholder="Feedback from parent/guardian (optional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm h-16 resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Week of {format(weeklySummary.weekStart, 'MMM dd')} - {format(weeklySummary.weekEnd, 'MMM dd, yyyy')}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{weeklySummary.totalLessons}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{weeklySummary.completedLessons}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{weeklySummary.attendanceRate.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold flex items-center justify-center space-x-1`}>
                      <span className={getProgressColor(weeklySummary.averageProgress).replace('bg-', 'text-').replace('-100', '-600')}>
                        {weeklySummary.averageProgress}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Progress</div>
                  </div>
                </div>

                {weeklySummary.keyAchievements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Achievements</h4>
                    <ul className="space-y-1">
                      {weeklySummary.keyAchievements.map((achievement, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {weeklySummary.upcomingGoals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Upcoming Goals</h4>
                    <ul className="space-y-1">
                      {weeklySummary.upcomingGoals.map((goal, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {format(monthlySummary.monthStart, 'MMMM yyyy')}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{monthlySummary.totalLessons}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{monthlySummary.completedLessons}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{monthlySummary.attendanceRate.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold flex items-center justify-center space-x-1 ${
                      monthlySummary.progressTrend === 'improving' ? 'text-green-600' :
                      monthlySummary.progressTrend === 'declining' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      <TrendingUp className="w-6 h-6" />
                      <span className="capitalize">{monthlySummary.progressTrend}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
                  </div>
                </div>

                {monthlySummary.milestones.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Milestones Achieved</h4>
                    <ul className="space-y-1">
                      {monthlySummary.milestones.map((milestone, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {monthlySummary.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Target className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'individual' && (
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSummary}
              disabled={createSessionSummaryMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createSessionSummaryMutation.isPending ? 'Saving...' : 'Save Summary'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
