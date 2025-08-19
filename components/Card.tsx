import React from 'react';

// By combining with React.HTMLAttributes, the Card can accept any standard div property like onClick.
// `children` is explicitly defined as required, and `className` is kept for clarity.
type CardProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div 
      className={`bg-surface-card dark:bg-slate-800 comfort:bg-comfort-card border border-surface-border dark:border-slate-700 comfort:border-comfort-border rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),_0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),_0_2px_4px_rgba(0,0,0,0.06)] transition-shadow duration-200 dark:shadow-none ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};