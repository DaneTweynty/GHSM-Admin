import React from 'react';
import { control } from './ui';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

export const ThemedSelect: React.FC<Props> = ({ className = '', wrapperClassName = '', children, disabled, ...rest }) => {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        {...rest}
        disabled={disabled}
        className={`${control} appearance-none pr-10 ${className}`}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 ${disabled ? 'text-text-tertiary' : 'text-text-secondary'}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
      </svg>
    </div>
  );
};

export default ThemedSelect;
