import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const baseClasses = "fixed top-5 right-5 max-w-sm w-full p-4 rounded-lg shadow-lg text-white flex items-center justify-between transform transition-all duration-300 ease-in-out z-[100]";
  const typeClasses = {
    success: 'bg-status-green',
    error: 'bg-status-red',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-white/80">
        &times;
      </button>
    </div>
  );
};
