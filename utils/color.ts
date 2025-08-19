/**
 * Color utility functions for determining optimal text contrast with theme awareness
 */

/**
 * Detects if the current theme is dark mode
 */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Detects if the current theme is comfort mode (warm light theme)
 */
export function isComfortMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('comfort');
}

/**
 * Gets the current theme mode
 */
export function getCurrentTheme(): 'dark' | 'comfort' | 'light' {
  if (isDarkMode()) return 'dark';
  if (isComfortMode()) return 'comfort';
  return 'light';
}

/**
 * Hook-like function that returns current theme and forces re-evaluation
 */
export function useCurrentTheme(): 'dark' | 'comfort' | 'light' {
  // Force a fresh read of the DOM classes
  return getCurrentTheme();
}

/**
 * Converts hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculates the luminance of a color
 * Using WCAG formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors
 */
function getContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Determines whether to use black or white text on a given background color
 * Returns 'black' or 'white' based on WCAG contrast guidelines
 */
export function getOptimalTextColor(backgroundColor: string): 'black' | 'white' {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) {
    // Fallback for invalid colors
    return 'white';
  }

  const blackRgb = { r: 0, g: 0, b: 0 };
  const whiteRgb = { r: 255, g: 255, b: 255 };

  const contrastWithBlack = getContrastRatio(rgb, blackRgb);
  const contrastWithWhite = getContrastRatio(rgb, whiteRgb);

  // WCAG AA requires a contrast ratio of at least 4.5:1 for normal text
  // We'll choose the option with higher contrast
  return contrastWithBlack > contrastWithWhite ? 'black' : 'white';
}

/**
 * Gets the appropriate text color classes for Tailwind
 */
export function getTextColorClasses(backgroundColor: string): string {
  const textColor = getOptimalTextColor(backgroundColor);
  return textColor === 'black' 
    ? 'text-gray-900 dark:text-gray-900' 
    : 'text-white dark:text-white';
}

/**
 * Enhanced function that provides strong contrast by adjusting colors based on theme
 */
export function getEnhancedTextColor(backgroundColor: string, themeMode?: 'dark' | 'comfort' | 'light'): { textColor: string; enhancedBackground?: string } {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) {
    return { textColor: 'text-white font-semibold' };
  }

  // Auto-detect theme if not provided
  const currentTheme = themeMode || getCurrentTheme();
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // Debug logging removed for production - excessive console output
  
  if (currentTheme === 'dark') {
    // DARK MODE: Keep pastel colors as they are - they look good against dark backgrounds
    // Only adjust text color for optimal contrast
    if (luminance > 0.5) {
      // Light pastel colors in dark mode - use dark text
      return {
        textColor: 'text-gray-900 font-semibold'
      };
    } else {
      // Darker colors in dark mode - use light text
      return {
        textColor: 'text-white font-semibold'
      };
    }
  } else {
    // LIGHT MODE & COMFORT MODE: Darken very light pastels for better contrast
    if (luminance > 0.8) {
      // Very light/pastel color - darken significantly and use black text
      const darkenFactor = 0.6; // Darken by 40%
      const enhancedBg = `rgb(${Math.round(rgb.r * darkenFactor)}, ${Math.round(rgb.g * darkenFactor)}, ${Math.round(rgb.b * darkenFactor)})`;
      return {
        textColor: 'text-gray-900 font-semibold',
        enhancedBackground: enhancedBg
      };
    }
    
    // If still quite light, darken moderately
    if (luminance > 0.6) {
      const darkenFactor = 0.75; // Darken by 25%
      const enhancedBg = `rgb(${Math.round(rgb.r * darkenFactor)}, ${Math.round(rgb.g * darkenFactor)}, ${Math.round(rgb.b * darkenFactor)})`;
      return {
        textColor: 'text-gray-900 font-semibold',
        enhancedBackground: enhancedBg
      };
    }
    
    // If the color is very dark, use white text
    if (luminance < 0.3) {
      return { textColor: 'text-white font-semibold' };
    }
    
    // Medium luminance - choose best contrast
    const textColor = getOptimalTextColor(backgroundColor);
    return {
      textColor: textColor === 'black' 
        ? 'text-gray-900 font-semibold' 
        : 'text-white font-semibold'
    };
  }
}
