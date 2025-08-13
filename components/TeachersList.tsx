import React, { useState } from 'react';
import type { Instructor, Student, Lesson } from '../types';
import { Card } from './Card';
import { TeacherDetailView } from './TeacherDetailView';
import { InstructorProfilePopover } from './InstructorProfileModal';
import { ICONS } from '../constants';
import { SearchBar } from './SearchBar';
import { PaginationControls } from './PaginationControls';

interface TeachersListProps {
  instructors: Instructor[];
  students: Student[];
  lessons: Lesson[];
  onMarkAttendance: (studentId: string) => void;
  onEditInstructor: (instructor: Instructor) => void;
  onAddInstructor: () => void;
  onToggleInstructorStatus: (instructorId: string) => void;
}

const getInitials = (name: string) => {
    const names = name.split(' ').filter(Boolean);
    if (names.length === 0) return 'N/A';
    if (names.length === 1) return names[0]!.charAt(0).toUpperCase();
    return (names[0]!.charAt(0) + names[names.length - 1]!.charAt(0)).toUpperCase();
};

const InstructorAvatar: React.FC<{ instructor: Instructor }> = ({ instructor }) => {
    if (instructor.profilePictureUrl) {
        return <img src={instructor.profilePictureUrl} alt={instructor.name} className="h-9 w-9 rounded-full object-cover shrink-0" />;
    }
    const initials = getInitials(instructor.name);
    return (
        <div 
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-text-primary dark:text-slate-800"
            style={{ backgroundColor: instructor.color, border: '1px solid rgba(0,0,0,0.1)' }}
            title={instructor.name}
        >
            <span className="text-xs font-bold">{initials}</span>
        </div>
    );
};


export const TeachersList: React.FC<TeachersListProps> = ({ instructors, students, lessons, onMarkAttendance, onEditInstructor, onAddInstructor, onToggleInstructorStatus }) => {
  const [expandedInstructorId, setExpandedInstructorId] = useState<string | null>(null);
  const [profilePopoverInstructorId, setProfilePopoverInstructorId] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // 12 instructors per page
  
  // Filter instructors based on search query
  const filteredInstructors = instructors.filter(instructor => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const name = instructor.name.toLowerCase();
    const status = instructor.status.toLowerCase();
    
    // Get specialties as searchable string
    const specialties = instructor.specialty.join(' ').toLowerCase();
    
    return name.includes(query) || 
           specialties.includes(query) || 
           status.includes(query);
  });
  
  // Calculate pagination with filtered results
  const sortedInstructors = [...filteredInstructors].sort((a, b) => a.name.localeCompare(b.name));
  const totalPages = Math.ceil(sortedInstructors.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInstructors = sortedInstructors.slice(startIndex, endIndex);

  const handleToggleDetails = (instructorId: string) => {
    setExpandedInstructorId(prevId => (prevId === instructorId ? null : instructorId));
  };

  const handleShowProfile = (instructorId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setProfilePopoverInstructorId(instructorId);
  };

  const handleCloseProfile = () => {
    setProfilePopoverInstructorId(null);
  };

  // Search handlers
  const _handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
    setExpandedInstructorId(null); // Close any expanded details when searching
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    setExpandedInstructorId(null);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedInstructorId(null); // Close any expanded details when changing pages
  };

  return (
    <div className="max-w-7xl mx-auto"> {/* Optimal container size */}
      <Card>
        <div className="p-4 sm:p-6">
          {/* Header with title and action buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary">Teacher List</h2>
              <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">
                Manage instructors and their specialties
                {filteredInstructors.length > 0 && (
                  <span>
                    {' '}({startIndex + 1}-{Math.min(endIndex, filteredInstructors.length)} of {filteredInstructors.length} instructor{filteredInstructors.length !== 1 ? 's' : ''})
                  </span>
                )}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onAddInstructor}
                className="flex items-center space-x-2 px-4 py-2 rounded-md font-semibold text-sm text-text-on-color bg-brand-primary hover:opacity-90 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Add Teacher</span>
              </button>
            </div>
          </div>

          {/* Search section */}
          <SearchBar
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
              setExpandedInstructorId(null);
            }}
            placeholder="Search by name, specialty, or status..."
            showResultsCount={true}
            totalResults={instructors.length}
            filteredResults={filteredInstructors.length}
            itemName="instructors"
          />
        </div>
      <div className="overflow-x-auto scrollbar-hidden">
        <table className="min-w-full divide-y divide-surface-border dark:divide-slate-700">
          <thead className="bg-surface-table-header dark:bg-slate-700 hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Instructor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Specialty</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-card dark:bg-slate-800 divide-y divide-surface-border dark:divide-slate-700">
            {paginatedInstructors.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <svg className="h-12 w-12 text-text-tertiary dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    {searchQuery ? (
                      <div className="text-center">
                        <p className="text-text-primary dark:text-slate-300 font-medium">No instructors found</p>
                        <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">
                          Try adjusting your search terms or{' '}
                          <button
                            onClick={handleClearSearch}
                            className="text-brand-primary hover:text-brand-primary/80 font-medium"
                          >
                            clear the search
                          </button>
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-text-primary dark:text-slate-300 font-medium">No instructors yet</p>
                        <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">
                          Get started by adding your first instructor
                        </p>
                        <button
                          onClick={onAddInstructor}
                          className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium text-text-on-color bg-brand-primary rounded-md hover:opacity-90 transition-opacity"
                        >
                          Add Instructor
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInstructors.map((instructor) => {
                const isExpanded = expandedInstructorId === instructor.id;
                return (
                    <React.Fragment key={instructor.id}>
                        <tr className={`block md:table-row hover:bg-surface-hover dark:hover:bg-slate-700/50 transition-all duration-300 ${instructor.status === 'inactive' ? 'opacity-60' : ''}`}>
                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell">
                                <div className="flex items-center justify-between w-full">
                                  <button onClick={() => handleToggleDetails(instructor.id)} className="flex items-center text-left group flex-1">
                                      <InstructorAvatar instructor={instructor} />
                                      <div className="ml-4 text-sm font-medium text-text-primary dark:text-slate-100 group-hover:text-brand-primary transition-colors">{instructor.name}</div>
                                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-auto text-text-tertiary dark:text-slate-500 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                  <button
                                    onClick={(e) => handleShowProfile(instructor.id, e)}
                                    className="ml-2 p-1 rounded-full text-text-tertiary hover:text-brand-primary hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
                                    aria-label={`View ${instructor.name} profile`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                </div>
                            </td>
                            <td data-label="Specialty" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left text-text-primary dark:text-slate-100">
                                <div className="text-sm text-text-secondary dark:text-slate-300">
                                  <div className="flex flex-wrap gap-1 justify-end md:justify-start">
                                    {Array.isArray(instructor.specialty) ? (
                                      instructor.specialty.slice(0, 2).map((spec, index) => (
                                        <span 
                                          key={index}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-primary/10 text-brand-primary dark:bg-brand-secondary/20 dark:text-brand-secondary"
                                        >
                                          {spec}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm">{instructor.specialty}</span>
                                    )}
                                    {Array.isArray(instructor.specialty) && instructor.specialty.length > 2 && (
                                      <span className="text-xs text-text-tertiary dark:text-slate-500">
                                        +{instructor.specialty.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                            </td>
                            <td data-label="Status" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left text-text-primary dark:text-slate-100">
                                <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full capitalize ${
                                    instructor.status === 'active' 
                                    ? 'bg-status-green-light dark:bg-status-green/20 text-status-green' 
                                    : 'bg-surface-input dark:bg-slate-700 text-text-secondary dark:text-slate-400'
                                }`}>
                                    {instructor.status}
                                </span>
                            </td>
                             <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-right text-sm font-medium block md:table-cell">
                                <div className="flex items-center justify-end space-x-2">
                                    <button
                                        onClick={() => onEditInstructor(instructor)}
                                        className="p-2 rounded-md text-text-secondary dark:text-slate-400 hover:bg-surface-hover dark:hover:bg-slate-700 hover:text-text-primary dark:hover:text-slate-200 transition-colors"
                                        aria-label={`Edit ${instructor.name}`}
                                    >
                                        {ICONS.edit}
                                    </button>
                                     <button
                                      onClick={() => onToggleInstructorStatus(instructor.id)}
                                      className={`w-24 text-center px-3 py-1 rounded-md transition-colors font-semibold text-xs ${
                                        instructor.status === 'active'
                                          ? 'bg-status-red-light dark:bg-status-red/20 text-text-primary dark:text-status-red hover:bg-black/5 dark:hover:bg-status-red/30'
                                          : 'bg-status-green-light dark:bg-status-green/20 text-text-primary dark:text-status-green hover:bg-black/5 dark:hover:bg-status-green/30'
                                      }`}
                                    >
                                      {instructor.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                        {isExpanded && (
                            <tr className="block md:table-row">
                                <td colSpan={4} className="p-0 block md:table-cell">
                                    <TeacherDetailView
                                        instructor={instructor}
                                        allLessons={lessons}
                                        allStudents={students}
                                        onMarkAttendance={onMarkAttendance}
                                    />
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls at the bottom */}
      {filteredInstructors.length > 0 && (
        <div className="px-4 py-4 sm:px-6 border-t border-surface-border dark:border-slate-700">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={pageSize}
            totalItems={filteredInstructors.length}
            itemName="instructors"
            onPageChange={handlePageChange}
            onItemsPerPageChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
              setExpandedInstructorId(null);
            }}
            showPageSizeSelector={true}
            pageSizeOptions={[5, 10, 25, 50, 100]}
          />
        </div>
      )}
      
      {/* Profile Modal */}
      {profilePopoverInstructorId && (
        <InstructorProfilePopover
          instructor={instructors.find(i => i.id === profilePopoverInstructorId)!}
          students={students}
          lessons={lessons}
          isOpen={true}
          onClose={handleCloseProfile}
        />
      )}
    </Card>
    </div>
  );
};

export default React.memo(TeachersList);