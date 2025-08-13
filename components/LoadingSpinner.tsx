
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  'aria-label'?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  message = 'Generating Schedule...', 
  'aria-label': ariaLabel = 'Loading content'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-t-2 border-b-2',
    md: 'h-12 w-12 border-t-3 border-b-3', 
    lg: 'h-16 w-16 border-t-4 border-b-4'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4" role="status" aria-label={ariaLabel}>
      <div className={`animate-spin rounded-full border-brand-primary ${sizeClasses[size]}`} aria-hidden="true"></div>
      <p className="text-text-secondary dark:text-slate-400 text-lg" aria-live="polite">{message}</p>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};