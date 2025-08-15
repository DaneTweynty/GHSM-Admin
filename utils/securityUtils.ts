import DOMPurify from 'dompurify';

/**
 * Security utility functions for sanitizing user input
 * Prevents XSS attacks and ensures safe rendering of user content
 */

/**
 * Sanitizes text content to prevent XSS attacks
 * @param text - The text to sanitize
 * @returns Sanitized text safe for rendering
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remove any HTML tags and sanitize the content
  const sanitized = DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [] // No HTML attributes allowed
  });
  
  return sanitized.trim();
};

/**
 * Sanitizes HTML content while allowing safe tags
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML safe for rendering
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Allow only safe HTML tags
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
  
  return sanitized;
};

/**
 * Validates and sanitizes an array of strings
 * @param items - Array of strings to sanitize
 * @returns Array of sanitized strings
 */
export const sanitizeStringArray = (items: string[]): string[] => {
  if (!Array.isArray(items)) return [];
  
  return items
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0);
};

/**
 * Truncates text to a maximum length for display
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the text
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 200): string => {
  if (!text) return '';
  
  const sanitized = sanitizeText(text);
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  
  return sanitized.substring(0, maxLength).trim() + '...';
};
