// Shared UI classnames for consistent theming of inputs/selects/textarea
// Keeps styling in TS to avoid relying on @apply in CSS layer

export const control = "w-full bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600 rounded-md p-2 text-text-primary dark:text-slate-100 placeholder-text-secondary dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-primary dark:focus:ring-brand-secondary focus:border-brand-primary dark:focus:border-brand-secondary transition-colors shadow-inner";
export const controlSm = control + " text-sm";
export const controlXs = control + " text-xs px-2 py-1";
export const selectIconless = control + " appearance-none pr-10";
