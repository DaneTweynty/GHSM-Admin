/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './{App,types,constants}.tsx',
    './{index,vite}.ts*',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'],
      },
      colors: {
        // Enhanced Brand Colors - WCAG AA Compliant
        'brand-primary': '#2563EB',        // Strong blue for better contrast
        'brand-primary-hover': '#1D4ED8',  // Darker for hover states
        'brand-secondary': '#7C3AED',      // Purple with good contrast
        'brand-secondary-hover': '#6D28D9',
        'brand-secondary-dark': '#5B21B6',
        'brand-secondary-deep-dark': '#4C1D95',

        // Light Theme Surfaces - Higher contrast, accessible
        'surface-main': '#FFFFFF',         // Pure white for maximum contrast
        'surface-card': '#F8FAFC',         // Very light gray for cards
        'surface-header': '#F1F5F9',       // Light gray for headers
        'surface-table-header': '#E2E8F0', // Slightly darker for table headers
        'surface-input': '#F8FAFC',        // Light background for inputs
        'surface-hover': '#E2E8F0',        // Gray hover state
        'surface-border': '#CBD5E1',       // Medium gray border

        // Comfort Theme Surfaces - Warmer but accessible
        'comfort-main': '#FEFEFE',         // Off-white main background
        'comfort-card': '#F9FAFB',         // Warm light gray for cards
        'comfort-header': '#F3F4F6',       // Warm gray for headers
        'comfort-input': '#F9FAFB',        // Warm light background for inputs
        'comfort-hover': '#E5E7EB',        // Warm gray hover
        'comfort-border': '#D1D5DB',       // Warm medium gray border

        // Enhanced Text Colors - WCAG AA Compliant
        'text-primary': '#1F2937',         // Dark gray, 4.5:1 contrast ratio
        'text-secondary': '#4B5563',       // Medium gray, good readability
        'text-tertiary': '#6B7280',        // Lighter gray for less important text
        'text-on-color': '#FFFFFF',        // White text on colored backgrounds
        'text-on-light': '#111827',        // Very dark text on light backgrounds

        // Interactive States
        'interactive-primary': '#2563EB',   // Blue for primary buttons
        'interactive-primary-hover': '#1D4ED8',
        'interactive-secondary': '#6B7280', // Gray for secondary buttons
        'interactive-secondary-hover': '#4B5563',
        'interactive-destructive': '#DC2626', // Red for destructive actions
        'interactive-destructive-hover': '#B91C1C',

        // Status Colors - Enhanced contrast
        'status-green': '#059669',         // Darker green for better contrast
        'status-green-light': '#D1FAE5',
        'status-yellow': '#D97706',        // Darker yellow for better contrast
        'status-yellow-light': '#FEF3C7',
        'status-red': '#DC2626',           // Good contrast red
        'status-red-light': '#FEE2E2',
        'status-blue': '#2563EB',
        'status-blue-light': '#DBEAFE',

        // Navigation and Tab Colors
        'nav-active': '#2563EB',           // Strong blue for active nav items
        'nav-inactive': '#6B7280',         // Gray for inactive nav items
        'nav-hover': '#4B5563',            // Darker gray for hover states
        'tab-active': '#2563EB',
        'tab-inactive': '#9CA3AF',
        'tab-border': '#E5E7EB',

        // Focus and Selection
        'focus-ring': '#93C5FD',           // Light blue for focus rings
        'selection': '#DBEAFE',            // Light blue for selections
      },
    },
  },
  plugins: [],
};
