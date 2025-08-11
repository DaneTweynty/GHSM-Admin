// Enhanced Theme Utilities
// Systematic approach to theming across all components

export type ThemeMode = 'light' | 'dark' | 'comfort' | 'system';

// Theme class constants to ensure consistency
export const THEME_CLASSES = {
  // Backgrounds
  bg: {
    main: 'bg-surface-main dark:bg-slate-900',
    card: 'bg-surface-card dark:bg-slate-800',
    header: 'bg-surface-header dark:bg-slate-800',
    input: 'bg-surface-input dark:bg-slate-700',
    hover: 'hover:bg-surface-hover dark:hover:bg-slate-700',
    button: 'bg-brand-primary hover:bg-brand-secondary',
    destructive: 'bg-status-red hover:bg-red-600',
  },
  
  // Text colors
  text: {
    primary: 'text-text-primary dark:text-slate-200',
    secondary: 'text-text-secondary dark:text-slate-400',
    tertiary: 'text-text-tertiary dark:text-slate-500',
    onColor: 'text-text-on-color',
    inverse: 'text-white dark:text-slate-900',
  },
  
  // Borders
  border: {
    default: 'border-surface-border dark:border-slate-700',
    input: 'border-surface-border dark:border-slate-600',
    focus: 'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
  },
  
  // Interactive states
  interactive: {
    button: 'transition-colors duration-200 rounded-lg px-4 py-2',
    input: 'transition-colors duration-200 rounded-md px-3 py-2',
    link: 'transition-colors duration-200 hover:text-brand-primary',
  }
} as const;

// Utility function to combine theme classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Component-specific theme generators
export const createButtonClasses = (variant: 'primary' | 'secondary' | 'destructive' = 'primary') => {
  const baseClasses = cn(
    THEME_CLASSES.interactive.button,
    'font-medium focus:outline-none focus:ring-2 focus:ring-offset-2'
  );
  
  const variants = {
    primary: cn(
      THEME_CLASSES.bg.button,
      THEME_CLASSES.text.onColor,
      'focus:ring-brand-primary'
    ),
    secondary: cn(
      THEME_CLASSES.bg.card,
      THEME_CLASSES.text.primary,
      THEME_CLASSES.border.default,
      'border',
      THEME_CLASSES.bg.hover
    ),
    destructive: cn(
      THEME_CLASSES.bg.destructive,
      'text-white',
      'focus:ring-red-500'
    )
  };
  
  return cn(baseClasses, variants[variant]);
};

export const createInputClasses = () => {
  return cn(
    THEME_CLASSES.bg.input,
    THEME_CLASSES.text.primary,
    THEME_CLASSES.border.input,
    THEME_CLASSES.border.focus,
    THEME_CLASSES.interactive.input,
    'w-full border placeholder-text-tertiary dark:placeholder-slate-500'
  );
};

export const createCardClasses = () => {
  return cn(
    THEME_CLASSES.bg.card,
    THEME_CLASSES.text.primary,
    THEME_CLASSES.border.default,
    'border rounded-lg shadow-sm'
  );
};

// Theme context integration utilities
export const useThemeClasses = () => {
  // This would integrate with the existing theme context
  return {
    button: createButtonClasses,
    input: createInputClasses,
    card: createCardClasses,
    bg: THEME_CLASSES.bg,
    text: THEME_CLASSES.text,
    border: THEME_CLASSES.border,
  };
};
