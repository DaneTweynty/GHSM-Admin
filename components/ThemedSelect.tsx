import React from 'react';
import { control } from './ui';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  hasError?: boolean;
};

export const ThemedSelect: React.FC<Props> = ({ 
  className = '', 
  wrapperClassName = '', 
  children, 
  disabled, 
  hasError = false,
  ...rest 
}) => {
  const selectClasses = `
    ${control} 
    appearance-none pr-10 
    bg-surface-card dark:bg-gray-700 comfort:bg-comfort-input
    border-surface-border dark:border-gray-600 comfort:border-comfort-border
    text-text-primary dark:text-gray-100 comfort:text-text-primary
    focus:border-brand-primary dark:focus:border-blue-400 
    focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-blue-400/20
    ${hasError ? 'border-status-red focus:border-status-red focus:ring-red-500/20' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    transition-all duration-200
    ${className}
  `;

  const iconColor = disabled 
    ? 'text-text-tertiary dark:text-gray-500' 
    : 'text-text-secondary dark:text-gray-400 comfort:text-text-secondary';

  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        {...rest}
        disabled={disabled}
        className={selectClasses.replace(/\s+/g, ' ').trim()}
        aria-invalid={hasError}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${iconColor}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
      </svg>
    </div>
  );
};

export default ThemedSelect;
