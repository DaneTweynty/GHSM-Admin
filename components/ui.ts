// Enhanced UI Components with WCAG AA Compliant Theme Support
// Comprehensive accessibility and visibility improvements

// Base control styling with improved accessibility
export const control = `
  w-full 
  bg-surface-card dark:bg-gray-700 comfort:bg-comfort-input
  border border-surface-border dark:border-gray-600 comfort:border-comfort-border
  rounded-md p-2.5
  text-text-primary dark:text-gray-100 comfort:text-text-primary
  placeholder-text-tertiary dark:placeholder-gray-400 comfort:placeholder-text-tertiary
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-blue-400/20
  focus:border-brand-primary dark:focus:border-blue-400
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
  bg-brand-primary hover:bg-brand-primary-hover 
  text-white font-medium py-2.5 px-4 rounded-lg
  transition-all duration-200 
  focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  shadow-sm hover:shadow-md
  dark:bg-brand-primary dark:hover:bg-brand-primary-hover
`.replace(/\s+/g, ' ').trim();

export const buttonSecondary = `
  bg-transparent hover:bg-surface-card dark:hover:bg-gray-700 comfort:hover:bg-comfort-card
  text-text-primary dark:text-gray-200 comfort:text-text-primary
  font-medium py-2.5 px-4 rounded-lg
  border border-surface-border dark:border-gray-600 comfort:border-comfort-border
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  hover:border-text-secondary dark:hover:border-gray-500
`.replace(/\s+/g, ' ').trim();

export const buttonDestructive = `
  bg-status-red hover:bg-status-red-light 
  text-white font-medium py-2.5 px-4 rounded-lg
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  shadow-sm hover:shadow-md
`.replace(/\s+/g, ' ').trim();

// Enhanced card styles
export const card = `
  bg-surface-card dark:bg-gray-800 comfort:bg-comfort-card
  border border-surface-border dark:border-gray-700 comfort:border-comfort-border
  rounded-lg shadow-sm p-4
  transition-all duration-200
  hover:shadow-md
`.replace(/\s+/g, ' ').trim();

export const cardHeader = `
  border-b border-surface-border dark:border-gray-700 comfort:border-comfort-border
  pb-4 mb-4
`.replace(/\s+/g, ' ').trim();

// Enhanced typography with proper contrast
export const heading1 = "text-2xl font-bold text-text-primary dark:text-gray-100 comfort:text-text-primary";
export const heading2 = "text-xl font-semibold text-text-primary dark:text-gray-100 comfort:text-text-primary";
export const heading3 = "text-lg font-medium text-text-primary dark:text-gray-100 comfort:text-text-primary";

export const textPrimary = "text-text-primary dark:text-gray-100 comfort:text-text-primary";
export const textSecondary = "text-text-secondary dark:text-gray-300 comfort:text-text-secondary";
export const textTertiary = "text-text-tertiary dark:text-gray-400 comfort:text-text-tertiary";

// Enhanced interactive elements
export const link = `
  text-brand-primary hover:text-brand-primary-hover 
  dark:text-blue-400 dark:hover:text-blue-300
  underline transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-sm
`.replace(/\s+/g, ' ').trim();

export const badge = `
  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
  bg-status-blue-light dark:bg-blue-900/30 comfort:bg-status-blue-light
  text-status-blue dark:text-blue-400 comfort:text-status-blue
`.replace(/\s+/g, ' ').trim();

// Navigation and tab styles
export const navItem = `
  flex items-center space-x-2 px-3 py-2 rounded-md font-medium
  transition-all duration-200
  text-text-secondary dark:text-gray-300 comfort:text-text-secondary
  hover:text-text-primary dark:hover:text-gray-100 comfort:hover:text-text-primary
  hover:bg-surface-hover dark:hover:bg-gray-700 comfort:hover:bg-comfort-hover
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20
`.replace(/\s+/g, ' ').trim();

export const navItemActive = `
  ${navItem}
  bg-brand-primary text-white font-semibold
  hover:bg-brand-primary-hover
`.replace(/\s+/g, ' ').trim();

export const tabItem = `
  px-4 py-2 border-b-2 border-transparent font-medium
  transition-all duration-200
  text-text-secondary dark:text-gray-300 comfort:text-text-secondary
  hover:text-text-primary dark:hover:text-gray-100 comfort:hover:text-text-primary
  hover:border-surface-border dark:hover:border-gray-600 comfort:hover:border-comfort-border
  focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-t-md
`.replace(/\s+/g, ' ').trim();

export const tabItemActive = `
  ${tabItem}
  text-brand-primary dark:text-blue-400 
  border-brand-primary dark:border-blue-400
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
  bg-black/50 dark:bg-black/70
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
