// Enhanced UI Components with Systematic Theme Support
// Updated to use consistent theming across all components

// Base control styling with comprehensive theme support
export const control = "w-full bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600 rounded-md p-2 text-text-primary dark:text-slate-100 placeholder-text-secondary dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 dark:focus:ring-brand-secondary/50 focus:border-brand-primary dark:focus:border-brand-secondary transition-all duration-200 shadow-inner";

// Size variants
export const controlSm = control + " text-sm py-1.5";
export const controlXs = control + " text-xs px-2 py-1";
export const controlLg = control + " text-lg p-3";

// Specialized variants
export const selectIconless = control + " appearance-none pr-10";

// Button styles with theme support
export const buttonPrimary = "bg-brand-primary hover:bg-brand-secondary text-text-on-color font-medium py-2 px-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow";

export const buttonSecondary = "bg-surface-card dark:bg-slate-700 hover:bg-surface-hover dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-medium py-2 px-4 rounded-md border border-surface-border dark:border-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

export const buttonDestructive = "bg-status-red hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow";

// Card styles
export const card = "bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg shadow-sm p-4 transition-colors duration-200";

export const cardHeader = "border-b border-surface-border dark:border-slate-700 pb-4 mb-4";

// Typography with theme support
export const heading1 = "text-2xl font-bold text-text-primary dark:text-slate-100";
export const heading2 = "text-xl font-semibold text-text-primary dark:text-slate-200";
export const heading3 = "text-lg font-medium text-text-primary dark:text-slate-200";

export const textPrimary = "text-text-primary dark:text-slate-200";
export const textSecondary = "text-text-secondary dark:text-slate-400";
export const textTertiary = "text-text-tertiary dark:text-slate-500";

// Interactive elements
export const link = "text-brand-primary hover:text-brand-secondary underline transition-colors duration-200";

export const badge = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary-light dark:bg-brand-primary/20 text-brand-primary dark:text-brand-secondary";

// Layout helpers
export const container = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";
export const flexCenter = "flex items-center justify-center";
export const flexBetween = "flex items-center justify-between";

// Animation classes
export const transition = "transition-all duration-200 ease-in-out";
export const fadeIn = "animate-in fade-in duration-200";
export const slideUp = "animate-in slide-in-from-bottom-2 duration-300";

// Utility function for combining classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
