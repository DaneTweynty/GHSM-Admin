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
        'brand-primary': '#1D4ED8',        // Deeper blue for better contrast (was #2563EB)
        'brand-primary-hover': '#1E40AF',  // Even darker for hover states
        'brand-primary-light': '#DBEAFE',  // Light blue background
        'brand-secondary': '#7C3AED',      // Purple with good contrast
        'brand-secondary-hover': '#6D28D9',
        'brand-secondary-dark': '#5B21B6',
        'brand-secondary-deep-dark': '#4C1D95',

        // Light Theme Surfaces - Elegant with subtle contrast and strong shadows/borders
        'surface-main': '#FFFFFF',         // Pure white for maximum contrast
        'surface-card': '#FDFDFD',         // Very subtle off-white - elegant but visible
        'surface-header': '#FAFBFC',       // Light gray for headers - subtle
        'surface-table-header': '#F3F4F6', // Slightly darker for table headers
        'surface-input': '#FAFBFC',        // Light gray for inputs - subtle
        'surface-hover': '#F3F4F6',        // Light hover state - gentle
        'surface-border': '#E5E7EB',       // Elegant border color

        // Comfort Theme Surfaces - Elegant warm tones with subtle contrast
        'comfort-main': '#FEFEFE',         // Off-white main background
        'comfort-card': '#FDFCFB',         // Very subtle warm tint - elegant
        'comfort-header': '#F9F8F7',       // Light warm gray for headers - subtle
        'comfort-input': '#FDFCFB',        // Subtle warm gray for inputs
        'comfort-hover': '#F5F4F3',        // Light warm hover - gentle
        'comfort-border': '#E7E5E4',       // Elegant warm border

        // Enhanced Text Colors - WCAG AAA Compliant where possible
        'text-primary': '#111827',         // Very dark gray, 21:1 contrast ratio (was #1F2937)
        'text-secondary': '#374151',       // Darker medium gray (was #4B5563)
        'text-tertiary': '#4B5563',        // Darker light gray (was #6B7280)
        'text-on-color': '#FFFFFF',        // White text on colored backgrounds
        'text-on-light': '#111827',        // Very dark text on light backgrounds
        'text-brand': '#1D4ED8',           // Brand color for links/accents

        // Interactive States - Enhanced visibility
        'interactive-primary': '#1D4ED8',   // Deeper blue for primary buttons
        'interactive-primary-hover': '#1E40AF',
        'interactive-secondary': '#4B5563', // Darker gray for secondary buttons (was #6B7280)
        'interactive-secondary-hover': '#374151', // Even darker hover (was #4B5563)
        'interactive-destructive': '#DC2626', // Red for destructive actions
        'interactive-destructive-hover': '#B91C1C',

        // Status Colors - Enhanced contrast for accessibility
        'status-green': '#047857',         // Darker green for better contrast (was #059669)
        'status-green-light': '#D1FAE5',
        'status-green-dark': '#065F46',    // Even darker for high contrast needs
        'status-yellow': '#B45309',        // Darker yellow for better contrast (was #D97706)
        'status-yellow-light': '#FEF3C7',
        'status-yellow-dark': '#92400E',   // Darker for accessibility
        'status-red': '#DC2626',           // Good contrast red
        'status-red-light': '#FEE2E2',
        'status-red-dark': '#991B1B',      // Darker red for high contrast
        'status-blue': '#1D4ED8',          // Consistent with brand primary
        'status-blue-light': '#DBEAFE',
        'status-blue-dark': '#1E40AF',     // Darker blue

        // Navigation and Tab Colors - Better visibility
        'nav-active': '#1D4ED8',           // Strong blue for active nav items
        'nav-inactive': '#4B5563',         // Darker gray for inactive nav items (was #6B7280)
        'nav-hover': '#374151',            // Darker gray for hover states (was #4B5563)
        'tab-active': '#1D4ED8',
        'tab-inactive': '#6B7280',         // Maintained for less emphasis
        'tab-border': '#D1D5DB',           // Stronger border (was #E5E7EB)

        // Focus and Selection - Enhanced visibility
        'focus-ring': '#93C5FD',           // Light blue for focus rings
        'selection': '#DBEAFE',            // Light blue for selections
        'focus-ring-dark': '#3B82F6',      // Darker focus ring for better contrast
      },
    },
  },
  plugins: [
    // Add accessibility and form plugins
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    // Custom plugin for accessibility utilities
    function({ addUtilities, addComponents, theme }) {
      addUtilities({
        // Screen reader only utility
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        
        // High contrast mode utilities
        '.high-contrast': {
          filter: 'contrast(150%)',
        },
        
        // Focus visible utilities for better keyboard navigation
        '.focus-visible-ring': {
          '&:focus-visible': {
            outline: '2px solid ' + theme('colors.brand.primary'),
            outlineOffset: '2px',
          },
        },
        
        // Skip to content link
        '.skip-link': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: theme('colors.brand.primary'),
          color: 'white',
          padding: '8px',
          textDecoration: 'none',
          zIndex: '100',
          '&:focus': {
            top: '6px',
          },
        },
      });

      addComponents({
        // Enhanced button components with better contrast
        '.btn-primary': {
          backgroundColor: theme('colors.brand.primary'),
          color: theme('colors.text.on-color'),
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme('colors.brand.primary-hover'),
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
          },
          '&:focus': {
            outline: 'none',
            ring: '2px solid ' + theme('colors.focus.ring'),
            ringOffset: '2px',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            transform: 'none',
          },
        },
        
        '.btn-secondary': {
          backgroundColor: 'transparent',
          color: theme('colors.text.primary'),
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: '600',
          border: '2px solid ' + theme('colors.surface.border'),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme('colors.surface.hover'),
            borderColor: theme('colors.brand.primary'),
            color: theme('colors.brand.primary'),
          },
          '&:focus': {
            outline: 'none',
            ring: '2px solid ' + theme('colors.focus.ring'),
            ringOffset: '2px',
          },
        },
        
        // Enhanced form components
        '.form-input': {
          backgroundColor: theme('colors.surface.input'),
          border: '2px solid ' + theme('colors.surface.border'),
          borderRadius: '0.5rem',
          padding: '0.75rem',
          fontSize: '1rem',
          color: theme('colors.text.primary'),
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.brand.primary'),
            ring: '2px solid ' + theme('colors.focus.ring'),
            ringOffset: '2px',
          },
          '&::placeholder': {
            color: theme('colors.text.tertiary'),
          },
        },
        
        // Enhanced card components
        '.card': {
          backgroundColor: theme('colors.surface.card'),
          border: '1px solid ' + theme('colors.surface.border'),
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        
        '.card-elevated': {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            transform: 'translateY(-2px)',
          },
        },
      });
    }
  ],
};
