import { useState, useEffect } from 'react';

/**
 * React hook that tracks theme changes and triggers re-renders
 */
export function useThemeDetection(): 'dark' | 'comfort' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'comfort' | 'light'>(() => {
    if (typeof document === 'undefined') return 'light';
    if (document.documentElement.classList.contains('dark')) return 'dark';
    if (document.documentElement.classList.contains('comfort')) return 'comfort';
    return 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateTheme = () => {
      if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
      } else if (document.documentElement.classList.contains('comfort')) {
        setTheme('comfort');
      } else {
        setTheme('light');
      }
    };

    // Create a MutationObserver to watch for class changes on the document element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateTheme();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Initial update
    updateTheme();

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return theme;
}
