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
  className={`bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.06),_0_1px_3px_rgba(16,24,40,0.10)] dark:shadow-none ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};