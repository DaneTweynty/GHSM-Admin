// Enhanced UI Components with Semantic Token Support
// WCAG AA Compliant Theme-Aware Design System

// Base control styling with automatic theme awareness
export const control = `
  w-full 
  bg-surface-input dark:bg-slate-700
  border border-surface-border dark:border-slate-600
  rounded-md p-2.5
  text-text-primary dark:text-slate-200
  placeholder-text-tertiary dark:placeholder-slate-500
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20
  focus:border-brand-primary
  transition-all duration-200
  shadow-sm focus:shadow-md
`.replace(/\s+/g, ' ').trim();

// Size variants with consistent accessibility
export const controlSm = control + " text-sm py-2 px-2";
export const controlXs = control + " text-xs px-2 py-1.5";
export const controlLg = control + " text-lg p-3.5";

// Specialized variants
export const selectIconless = control + " appearance-none pr-10";

// Enhanced button styles with WCAG AA compliance
export const buttonPrimary = `
  bg-brand-primary hover:bg-brand-primary/90 
  text-white font-medium py-2.5 px-4 rounded-lg
  transition-all duration-200 
  focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  shadow-sm hover:shadow-md
`.replace(/\s+/g, ' ').trim();

export const buttonSecondary = `
  bg-transparent hover:bg-surface-hover dark:hover:bg-slate-700
  text-text-primary dark:text-slate-200
  font-medium py-2.5 px-4 rounded-lg
  border border-surface-border dark:border-slate-600
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  hover:border-text-secondary dark:hover:border-slate-500
`.replace(/\s+/g, ' ').trim();

export const buttonDestructive = `
  bg-status-error hover:bg-status-error/90 
  text-white font-medium py-2.5 px-4 rounded-lg
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-status-error/30 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  shadow-sm hover:shadow-md
`.replace(/\s+/g, ' ').trim();

// Enhanced card styles
export const card = `
  bg-surface-card
  border border-surface-border
  rounded-lg shadow-sm p-4
  transition-all duration-200
  hover:shadow-md
`.replace(/\s+/g, ' ').trim();

export const cardHeader = `
  border-b border-surface-border
  pb-4 mb-4
`.replace(/\s+/g, ' ').trim();

// Enhanced typography with semantic tokens
export const heading1 = "text-2xl font-bold text-text-primary";
export const heading2 = "text-xl font-semibold text-text-primary";
export const heading3 = "text-lg font-medium text-text-primary";

export const textPrimary = "text-text-primary";
export const textSecondary = "text-text-secondary";
export const textTertiary = "text-text-tertiary";

// Enhanced interactive elements
export const link = `
  text-brand-primary hover:text-brand-primary/80
  underline transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-sm
`.replace(/\s+/g, ' ').trim();

export const badge = `
  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
  bg-status-info-light
  text-status-info
`.replace(/\s+/g, ' ').trim();

// Navigation and tab styles
export const navItem = `
  flex items-center space-x-2 px-3 py-2 rounded-md font-medium
  transition-all duration-200
  text-text-secondary
  hover:text-text-primary
  hover:bg-surface-hover
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20
`.replace(/\s+/g, ' ').trim();

export const navItemActive = `
  ${navItem}
  bg-brand-primary text-white font-semibold
  hover:bg-brand-primary/90
`.replace(/\s+/g, ' ').trim();

export const tabItem = `
  px-4 py-2 border-b-2 border-transparent font-medium
  transition-all duration-200
  text-text-secondary
  hover:text-text-primary
  hover:border-surface-border
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-t-md
`.replace(/\s+/g, ' ').trim();

export const tabItemActive = `
  ${tabItem}
  text-brand-primary
  border-brand-primary
  font-semibold
`.replace(/\s+/g, ' ').trim();

// Layout helpers
export const container = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";
export const flexCenter = "flex items-center justify-center";
export const flexBetween = "flex items-center justify-between";

// Enhanced animation classes
export const transition = "transition-all duration-200 ease-in-out";
export const fadeIn = "animate-in fade-in duration-200";
export const slideUp = "animate-in slide-in-from-bottom-2 duration-300";

// Modal and overlay styles
export const modalOverlay = `
  fixed inset-0 z-50 
  bg-black/50
  backdrop-blur-sm
  flex items-center justify-center p-4
`.replace(/\s+/g, ' ').trim();

export const modalContent = `
  ${card}
  w-full max-w-md max-h-[90vh] overflow-auto
  shadow-xl
`.replace(/\s+/g, ' ').trim();

// Utility function for combining classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
