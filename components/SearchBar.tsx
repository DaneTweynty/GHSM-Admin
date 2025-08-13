import React from 'react';
import { control } from './ui';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showResultsCount?: boolean;
  totalResults?: number;
  filteredResults?: number;
  itemName?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  showResultsCount = false,
  totalResults = 0,
  filteredResults = 0,
  itemName = "items"
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-text-tertiary dark:text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          className={`${control} pl-10 ${value ? 'pr-10' : ''} sm:text-sm`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {showResultsCount && value && (
        <div className="text-sm text-text-secondary dark:text-slate-400">
          {filteredResults === 0 ? (
            <span className="text-status-red">No {itemName} found</span>
          ) : (
            <span>
              {filteredResults} result{filteredResults !== 1 ? 's' : ''}
              {filteredResults !== totalResults && (
                <span className="text-brand-primary"> (filtered from {totalResults} total)</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
