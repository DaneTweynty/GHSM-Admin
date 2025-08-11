import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-surface-hover dark:bg-slate-700 rounded ${className}`}
      aria-hidden="true"
    />
  );
};

// Student List Skeleton
export const StudentListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4" role="status" aria-label="Loading students">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-surface-card dark:bg-slate-800 rounded-lg p-4 border border-surface-border dark:border-slate-700">
          <div className="flex items-center space-x-4">
            {/* Avatar skeleton */}
            <Skeleton className="h-9 w-9 rounded-full" />
            
            <div className="flex-1 space-y-2">
              {/* Name skeleton */}
              <Skeleton className="h-4 w-32" />
              {/* Info skeleton */}
              <Skeleton className="h-3 w-48" />
            </div>
            
            {/* Status skeleton */}
            <Skeleton className="h-6 w-16 rounded-full" />
            
            {/* Action buttons skeleton */}
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Teacher List Skeleton
export const TeacherListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4" role="status" aria-label="Loading teachers">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface-card dark:bg-slate-800 rounded-lg p-4 border border-surface-border dark:border-slate-700">
          <div className="flex items-center space-x-4">
            {/* Avatar skeleton */}
            <Skeleton className="h-10 w-10 rounded-full" />
            
            <div className="flex-1 space-y-2">
              {/* Name skeleton */}
              <Skeleton className="h-4 w-36" />
              {/* Specialties skeleton */}
              <div className="flex space-x-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            
            {/* Student count skeleton */}
            <Skeleton className="h-6 w-12" />
            
            {/* Action button skeleton */}
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Billing List Skeleton
export const BillingListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4" role="status" aria-label="Loading billing information">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-surface-card dark:bg-slate-800 rounded-lg p-4 border border-surface-border dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar skeleton */}
              <Skeleton className="h-8 w-8 rounded-full" />
              
              <div className="space-y-2">
                {/* Student name skeleton */}
                <Skeleton className="h-4 w-28" />
                {/* Billing period skeleton */}
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Amount skeleton */}
              <Skeleton className="h-5 w-16" />
              
              {/* Status skeleton */}
              <Skeleton className="h-6 w-20 rounded-full" />
              
              {/* Action button skeleton */}
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Calendar Skeleton
export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="space-y-4" role="status" aria-label="Loading calendar">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      
      {/* Calendar grid skeleton */}
      <div className="grid grid-cols-7 gap-2">
        {/* Days of week */}
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
        
        {/* Calendar days */}
        {[...Array(35)].map((_, i) => (
          <div key={i} className="aspect-square p-2">
            <Skeleton className="h-full w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Chat Skeleton
export const ChatSkeleton: React.FC = () => {
  return (
    <div className="space-y-4" role="status" aria-label="Loading chat">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-xs space-y-2 ${i % 2 === 0 ? 'bg-surface-card dark:bg-slate-700' : 'bg-brand-primary/20'} rounded-lg p-3`}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Generic Card Skeleton
export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="bg-surface-card dark:bg-slate-800 rounded-lg p-6 border border-surface-border dark:border-slate-700" role="status" aria-label="Loading content">
      <div className="space-y-4">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-48" />
        
        {/* Content lines skeleton */}
        <div className="space-y-2">
          {[...Array(lines)].map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
        
        {/* Action area skeleton */}
        <div className="flex justify-end space-x-2 pt-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
