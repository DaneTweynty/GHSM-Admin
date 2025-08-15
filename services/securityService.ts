/**
 * Security Service - Comprehensive security utilities and validation
 * 
 * This service provides:
 * - Input validation and sanitization
 * - Rate limiting
 * - Security headers
 * - Audit logging
 * - XSS protection
 * - CSRF protection
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for audit logging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting types
interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (context: Record<string, unknown>) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Audit log types
interface AuditLogEntry {
  id?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

class SecurityService {
  private rateLimitStore: RateLimitStore = {};
  private defaultRateLimit: RateLimitRule = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  };

  /**
   * Input validation and sanitization
   */
  validateAndSanitize = {
    // Email validation
    email: (email: string): { isValid: boolean; sanitized: string; errors: string[] } => {
      const errors: string[] = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!email || typeof email !== 'string') {
        errors.push('Email is required');
        return { isValid: false, sanitized: '', errors };
      }

      const sanitized = email.trim().toLowerCase();
      
      if (!emailRegex.test(sanitized)) {
        errors.push('Invalid email format');
      }

      if (sanitized.length > 254) {
        errors.push('Email too long');
      }

      return { isValid: errors.length === 0, sanitized, errors };
    },

    // Phone number validation (Philippine format)
    phone: (phone: string): { isValid: boolean; sanitized: string; errors: string[] } => {
      const errors: string[] = [];
      
      if (!phone || typeof phone !== 'string') {
        errors.push('Phone number is required');
        return { isValid: false, sanitized: '', errors };
      }

      // Remove all non-digit characters
      let sanitized = phone.replace(/\D/g, '');
      
      // Handle Philippine mobile number formats
      if (sanitized.startsWith('63') && sanitized.length === 12) {
        // +63 format
        sanitized = '+' + sanitized;
      } else if (sanitized.startsWith('09') && sanitized.length === 11) {
        // 09 format - convert to +63
        sanitized = '+63' + sanitized.substring(1);
      } else if (sanitized.startsWith('9') && sanitized.length === 10) {
        // 9 format - convert to +63
        sanitized = '+639' + sanitized.substring(1);
      } else {
        errors.push('Invalid Philippine phone number format');
      }

      return { isValid: errors.length === 0, sanitized, errors };
    },

    // Name validation
    name: (name: string): { isValid: boolean; sanitized: string; errors: string[] } => {
      const errors: string[] = [];
      
      if (!name || typeof name !== 'string') {
        errors.push('Name is required');
        return { isValid: false, sanitized: '', errors };
      }

      const sanitized = name.trim().replace(/\s+/g, ' ');
      
      if (sanitized.length < 2) {
        errors.push('Name must be at least 2 characters');
      }

      if (sanitized.length > 100) {
        errors.push('Name must be less than 100 characters');
      }

      // Allow letters, spaces, hyphens, apostrophes, and common accented characters
      const nameRegex = /^[a-zA-ZÀ-ÿĀ-žÑñ\s'-]+$/;
      if (!nameRegex.test(sanitized)) {
        errors.push('Name contains invalid characters');
      }

      return { isValid: errors.length === 0, sanitized, errors };
    },

    // General text sanitization (XSS protection)
    text: (text: string, maxLength = 1000): { isValid: boolean; sanitized: string; errors: string[] } => {
      const errors: string[] = [];
      
      if (typeof text !== 'string') {
        errors.push('Text must be a string');
        return { isValid: false, sanitized: '', errors };
      }

      // Basic XSS protection - remove potential HTML/JS
      let sanitized = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();

      if (sanitized.length > maxLength) {
        errors.push(`Text must be less than ${maxLength} characters`);
        sanitized = sanitized.substring(0, maxLength);
      }

      return { isValid: errors.length === 0, sanitized, errors };
    },

    // ID validation (UUIDs, numbers)
    id: (id: string | number): { isValid: boolean; sanitized: string; errors: string[] } => {
      const errors: string[] = [];
      
      if (id === null || id === undefined) {
        errors.push('ID is required');
        return { isValid: false, sanitized: '', errors };
      }

      const sanitized = String(id).trim();
      
      // UUID pattern
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // Numeric ID pattern
      const numericRegex = /^\d+$/;
      
      if (!uuidRegex.test(sanitized) && !numericRegex.test(sanitized)) {
        errors.push('Invalid ID format');
      }

      return { isValid: errors.length === 0, sanitized, errors };
    },
  };

  /**
   * Rate limiting functionality
   */
  checkRateLimit = (
    key: string, 
    rule: Partial<RateLimitRule> = {},
    context?: Record<string, unknown>
  ): { allowed: boolean; resetTime: number; remainingRequests: number } => {
    const finalRule = { ...this.defaultRateLimit, ...rule };
    const now = Date.now();
    
    // Generate key with optional custom key generator
    const rateLimitKey = finalRule.keyGenerator 
      ? finalRule.keyGenerator(context || {})
      : key;

    // Get or create rate limit entry
    const entry = this.rateLimitStore[rateLimitKey];
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.rateLimitStore[rateLimitKey] = {
        count: 1,
        resetTime: now + finalRule.windowMs,
      };
      return {
        allowed: true,
        resetTime: now + finalRule.windowMs,
        remainingRequests: finalRule.maxRequests - 1,
      };
    }

    if (entry.count >= finalRule.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remainingRequests: 0,
      };
    }

    // Increment count
    entry.count++;
    
    return {
      allowed: true,
      resetTime: entry.resetTime,
      remainingRequests: finalRule.maxRequests - entry.count,
    };
  };

  /**
   * Clean up expired rate limit entries
   */
  cleanupRateLimit = (): void => {
    const now = Date.now();
    Object.keys(this.rateLimitStore).forEach(key => {
      if (this.rateLimitStore[key].resetTime <= now) {
        delete this.rateLimitStore[key];
      }
    });
  };

  /**
   * Audit logging
   */
  logActivity = async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> => {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
        ip_address: entry.ip_address || this.getClientIP(),
        user_agent: entry.user_agent || navigator.userAgent,
      };

      // Log to console in development
      if (import.meta.env.DEV) {
        console.warn('Audit Log:', auditEntry);
      }

      // Store in database
      const { error } = await supabase
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw - logging failures shouldn't break the app
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  };

  /**
   * Security headers setup
   */
  getSecurityHeaders = (): Record<string, string> => {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.supabase.co wss://api.supabase.co",
        "frame-ancestors 'none'",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  };

  /**
   * CSRF token management
   */
  generateCSRFToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  validateCSRFToken = (token: string, expectedToken: string): boolean => {
    if (!token || !expectedToken || token.length !== expectedToken.length) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
    }
    
    return result === 0;
  };

  /**
   * Input validation for common data types
   */
  validateBulkInput = (data: Record<string, unknown>): { 
    isValid: boolean; 
    sanitized: Record<string, unknown>; 
    errors: Record<string, string[]> 
  } => {
    const errors: Record<string, string[]> = {};
    const sanitized: Record<string, unknown> = {};

    // Validate each field based on its key
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        if (key.includes('email')) {
          const result = this.validateAndSanitize.email(value);
          sanitized[key] = result.sanitized;
          if (!result.isValid) errors[key] = result.errors;
        } else if (key.includes('phone')) {
          const result = this.validateAndSanitize.phone(value);
          sanitized[key] = result.sanitized;
          if (!result.isValid) errors[key] = result.errors;
        } else if (key.includes('name')) {
          const result = this.validateAndSanitize.name(value);
          sanitized[key] = result.sanitized;
          if (!result.isValid) errors[key] = result.errors;
        } else if (key.includes('id')) {
          const result = this.validateAndSanitize.id(value);
          sanitized[key] = result.sanitized;
          if (!result.isValid) errors[key] = result.errors;
        } else {
          const result = this.validateAndSanitize.text(value);
          sanitized[key] = result.sanitized;
          if (!result.isValid) errors[key] = result.errors;
        }
      } else {
        sanitized[key] = value;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      sanitized,
      errors,
    };
  };

  /**
   * Get client IP address (best effort)
   */
  private getClientIP = (): string => {
    // This is limited in browser environment
    // In production, this would be handled server-side
    return 'client-side';
  };

  /**
   * Periodic cleanup
   */
  startPeriodicCleanup = (): void => {
    setInterval(() => {
      this.cleanupRateLimit();
    }, 5 * 60 * 1000); // Every 5 minutes
  };
}

// Export singleton instance
export const securityService = new SecurityService();

// Security middleware for API calls
export const withSecurity = (
  operation: string,
  rateLimitRule?: Partial<RateLimitRule>
) => {
  return async <T>(fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T> => {
    // Check rate limit
    const rateLimitResult = securityService.checkRateLimit(
      operation,
      rateLimitRule,
      context
    );

    if (!rateLimitResult.allowed) {
      const error = new Error('Rate limit exceeded') as Error & { code: string; resetTime: number };
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.resetTime = rateLimitResult.resetTime;
      throw error;
    }

    try {
      const result = await fn();
      
      // Log successful operation
      await securityService.logActivity({
        action: operation,
        resource_type: context?.resourceType as string || 'unknown',
        resource_id: context?.resourceId as string,
        severity: 'info',
        metadata: { success: true, ...context },
      });

      return result;
    } catch (error) {
      // Log failed operation
      await securityService.logActivity({
        action: operation,
        resource_type: context?.resourceType as string || 'unknown',
        resource_id: context?.resourceId as string,
        severity: 'error',
        metadata: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          ...context 
        },
      });

      throw error;
    }
  };
};

export default securityService;
