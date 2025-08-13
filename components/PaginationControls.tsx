import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage?: number;
  totalItems: number;
  itemName: string; // e.g., "students" or "instructors"
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  itemsPerPage = 10,
  totalItems,
  itemName,
  onPageChange,
  onItemsPerPageChange,
  showPageSizeSelector = false,
  pageSizeOptions = [5, 10, 25, 50, 100]
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const goToPage = (page: number) => {
    onPageChange(page);
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Page Size Selector */}
      {showPageSizeSelector && onItemsPerPageChange && (
        <div className="flex items-center space-x-2">
          <label htmlFor="page-size" className="text-sm text-text-secondary dark:text-slate-400">
            Show:
          </label>
          <select
            id="page-size"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-surface-border dark:border-slate-600 rounded bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size} {itemName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Results Info */}
      <div className="text-sm text-text-secondary dark:text-slate-400">
        Showing {startIndex + 1}-{endIndex} of {totalItems} {itemName}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-surface-border dark:border-slate-600 rounded bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 7) {
                pageNumber = i + 1;
              } else if (currentPage <= 4) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNumber = totalPages - 6 + i;
              } else {
                pageNumber = currentPage - 3 + i;
              }
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`px-3 py-1 text-sm border rounded transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'border-surface-border dark:border-slate-600 bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100 hover:bg-surface-hover dark:hover:bg-slate-700'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-surface-border dark:border-slate-600 rounded bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
