import React, { useState, useMemo } from 'react';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '../hooks/useSupabase';
import { StudentsList } from '../components/StudentsList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { BulkStudentUploadModal } from '../components/BulkStudentUploadModal';
import { ICONS } from '../constants';
import type { Student } from '../types';

export const StudentsPageWithQueries: React.FC = () => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Use proper React Query hooks for data fetching
  const { 
    data: students = [], 
    isLoading, 
    error,
    refetch 
  } = useStudents();

  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    
    const search = searchTerm.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.guardianName?.toLowerCase().includes(search) ||
      student.instrument?.toLowerCase().includes(search)
    );
  }, [students, searchTerm]);

  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleBulkUpload = async (studentsData: Partial<Student>[]) => {
    try {
      for (const studentData of studentsData) {
        await createStudentMutation.mutateAsync(studentData);
      }
      setIsBulkUploadOpen(false);
      await refetch();
    } catch (error) {
      console.error('Failed to bulk upload students:', error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedStudents.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedStudents.size} student(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      for (const studentId of selectedStudents) {
        await deleteStudentMutation.mutateAsync(studentId);
      }
      setSelectedStudents(new Set());
      await refetch();
    } catch (error) {
      console.error('Failed to delete students:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-text-secondary">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-status-red mb-2">
            {React.cloneElement(ICONS.warning, { className: 'h-8 w-8 mx-auto' })}
          </div>
          <p className="text-text-primary font-medium">Failed to load students</p>
          <p className="text-text-secondary text-sm mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <button 
            onClick={() => refetch()} 
            className="mt-3 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Students</h1>
            <p className="text-text-secondary mt-1">
              {students.length} total student{students.length !== 1 ? 's' : ''}
              {filteredStudents.length !== students.length && (
                <span> • {filteredStudents.length} visible</span>
              )}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setIsBulkUploadOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-card border border-surface-border rounded-md hover:bg-surface-hover transition-colors"
            >
              {React.cloneElement(ICONS.upload, { className: 'h-4 w-4' })}
              <span>Bulk Upload</span>
            </button>
            
            {selectedStudents.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center space-x-2 px-4 py-2 bg-status-red text-white rounded-md hover:bg-status-red-dark transition-colors"
              >
                {React.cloneElement(ICONS.trash, { className: 'h-4 w-4' })}
                <span>Delete ({selectedStudents.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {React.cloneElement(ICONS.search, { className: 'h-5 w-5 text-text-tertiary' })}
            </div>
            <input
              type="text"
              placeholder="Search students by name, email, guardian, or instrument..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-surface-border rounded-md bg-surface-input focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          
          {filteredStudents.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 text-sm border border-surface-border rounded-md hover:bg-surface-hover transition-colors"
            >
              {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Students List */}
        <StudentsList
          students={filteredStudents}
          selectedStudents={selectedStudents}
          onStudentSelect={handleStudentSelect}
          onStudentUpdate={(id, updates) => updateStudentMutation.mutate({ id, updates })}
          onStudentDelete={(id) => deleteStudentMutation.mutate(id)}
        />

        {/* Bulk Upload Modal */}
        <BulkStudentUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          onUpload={handleBulkUpload}
        />
      </div>
    </ErrorBoundary>
  );
};
