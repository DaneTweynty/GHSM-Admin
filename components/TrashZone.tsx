import React, { useState } from 'react';

interface TrashZoneProps {
  isVisible: boolean; // This prop now signifies that a drag is in progress anywhere on the page
  onDropLesson: (lessonId: string) => void;
}

const TrashIcon: React.FC<{ isOver: boolean }> = ({ isOver }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-[28px] w-[28px] transition-all duration-300"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Lid */}
    <path 
        d="M3 6h18" 
        className={`transition-transform duration-300 ease-in-out ${isOver ? 'translate-x-1 -translate-y-1 rotate-[-15deg]' : ''}`}
        style={{ transformOrigin: '5px 6px' }}
    />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    {/* Can */}
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const TrashZone: React.FC<TrashZoneProps> = ({ isVisible: isDragInProgress, onDropLesson }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const lessonId = e.dataTransfer.getData('lessonId');
    if (lessonId) {
      onDropLesson(lessonId);
    }
    setIsOver(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`fixed bottom-0 left-0 right-0 h-40 z-40 flex justify-center items-end pb-5
      bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-black/5 dark:from-white/10 via-transparent
      transition-opacity duration-300 ease-in-out
      ${ isDragInProgress ? 'pointer-events-auto' : 'pointer-events-none' }
      ${ isOver ? 'opacity-100' : 'opacity-0' }
      `}
      aria-hidden={!isDragInProgress}
    >
      <div
        className={`
          w-[72px] h-[72px]
          flex items-center justify-center
          rounded-full
          bg-black/5 dark:bg-white/10
          backdrop-blur-xl
          border border-black/10 dark:border-white/20
          shadow-lg
          transition-all duration-300 ease-in-out
          ${isOver ? 'scale-110 bg-status-red/20 border-status-red/30' : 'scale-100'}
        `}
        aria-label="Trash Zone"
      >
        <div className={`transition-colors duration-300 ${isOver ? 'text-status-red' : 'text-slate-500 dark:text-slate-400'}`}>
          <TrashIcon isOver={isOver} />
        </div>
      </div>
    </div>
  );
};