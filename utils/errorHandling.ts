import { PostgrestError } from '@supabase/supabase-js';

export interface ErrorReport {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  category: 'supabase' | 'network' | 'validation' | 'auth' | 'sync' | 'migration' | 'ui' | 'unknown';
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, unknown>;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  retryCondition?: (error: Error) => boolean;
}

export interface ErrorHandlerOptions {
  enableLogging: boolean;
  enableReporting: boolean;
  logLevel: 'error' | 'warning' | 'info';
  maxReports: number;
  reportingEndpoint?: string;
}

class ErrorHandlingService {
  private errorReports: ErrorReport[] = [];
  private readonly STORAGE_KEY = 'ghsm_error_reports';
  private readonly MAX_STORED_REPORTS = 100;
  private sessionId: string;
  
  private options: ErrorHandlerOptions = {
    enableLogging: true,
    enableReporting: false,
    logLevel: 'error',
    maxReports: 50
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadReportsFromStorage();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load error reports from localStorage
   */
  private loadReportsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.errorReports = JSON.parse(stored);
        // Keep only recent reports
        this.errorReports = this.errorReports
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.MAX_STORED_REPORTS);
      }
    } catch (error) {
      console.warn('Failed to load error reports from storage:', error);
      this.errorReports = [];
    }
  }

  /**
   * Save error reports to localStorage
   */
  private saveReportsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorReports));
    } catch (error) {
      console.warn('Failed to save error reports to storage:', error);
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        category: 'ui',
        context: {
          filename: event.filename,
          line: event.lineno,
          column: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          category: 'unknown',
          context: { type: 'unhandled_promise_rejection' }
        }
      );
    });
  }

  /**
   * Configure error handling options
   */
  configure(options: Partial<ErrorHandlerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Categorize an error based on its properties
   */
  private categorizeError(error: Error): ErrorReport['category'] {
    if (error.message.includes('supabase') || error.message.includes('postgres')) {
      return 'supabase';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'network';
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'validation';
    }
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return 'auth';
    }
    if (error.message.includes('sync') || error.message.includes('offline')) {
      return 'sync';
    }
    if (error.message.includes('migration') || error.message.includes('schema')) {
      return 'migration';
    }
    return 'unknown';
  }

  /**
   * Report an error with context
   */
  reportError(
    error: Error | string,
    options: {
      level?: ErrorReport['level'];
      category?: ErrorReport['category'];
      context?: Record<string, unknown>;
      userId?: string;
    } = {}
  ): string {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const report: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level: options.level || 'error',
      category: options.category || this.categorizeError(errorObj),
      message: errorObj.message,
      details: this.extractErrorDetails(errorObj),
      stack: errorObj.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: options.userId,
      sessionId: this.sessionId,
      context: options.context
    };

    // Add to reports array
    this.errorReports.unshift(report);
    
    // Trim to max size
    if (this.errorReports.length > this.MAX_STORED_REPORTS) {
      this.errorReports = this.errorReports.slice(0, this.MAX_STORED_REPORTS);
    }

    this.saveReportsToStorage();

    // Log to console if enabled
    if (this.options.enableLogging) {
      this.logError(report);
    }

    // Send to reporting endpoint if configured
    if (this.options.enableReporting && this.options.reportingEndpoint) {
      this.sendErrorReport(report);
    }

    return report.id;
  }

  /**
   * Extract detailed information from error objects
   */
  private extractErrorDetails(error: Error): Record<string, unknown> {
    const details: Record<string, unknown> = {
      name: error.name,
      message: error.message
    };

    // Extract Supabase-specific error details
    const supabaseError = error as Error & { 
      code?: string; 
      details?: string; 
      hint?: string; 
    };
    
    if (supabaseError.code) {
      details.code = supabaseError.code;
    }
    if (supabaseError.details) {
      details.supabaseDetails = supabaseError.details;
    }
    if (supabaseError.hint) {
      details.hint = supabaseError.hint;
    }

    // Extract network error details
    if (error instanceof TypeError && error.message.includes('fetch')) {
      details.type = 'network_error';
    }

    return details;
  }

  /**
   * Log error to console with appropriate level
   */
  private logError(report: ErrorReport): void {
    const message = `[${report.category.toUpperCase()}] ${report.message}`;
    
    switch (report.level) {
      case 'error':
        console.error(message, report);
        break;
      case 'warning':
        console.warn(message, report);
        break;
      case 'info':
        console.warn(`[INFO] ${message}`, report);
        break;
    }
  }

  /**
   * Send error report to external endpoint
   */
  private async sendErrorReport(report: ErrorReport): Promise<void> {
    if (!this.options.reportingEndpoint) return;

    try {
      await fetch(this.options.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.warn('Failed to send error report:', error);
    }
  }

  /**
   * Handle Supabase-specific errors
   */
  handleSupabaseError(
    error: PostgrestError | Error,
    context: Record<string, unknown> = {}
  ): string {
    let category: ErrorReport['category'] = 'supabase';
    let level: ErrorReport['level'] = 'error';

    // Determine severity based on error code
    if ('code' in error) {
      const code = error.code;
      
      // Authentication errors
      if (code === '401' || code === 'PGRST301') {
        category = 'auth';
        level = 'warning';
      }
      // RLS policy violations
      else if (code === 'PGRST116' || code === '42501') {
        category = 'auth';
        level = 'warning';
      }
      // Connection errors
      else if (code === 'PGRST301' || code === '08006') {
        category = 'network';
        level = 'error';
      }
      // Validation errors
      else if (code === '23505' || code === '23503' || code === '23514') {
        category = 'validation';
        level = 'warning';
      }
    }

    return this.reportError(error, {
      level,
      category,
      context: {
        ...context,
        supabaseError: true
      }
    });
  }

  /**
   * Retry a function with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config: RetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      exponentialBackoff: true,
      ...options
    };

    let lastError: Error;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if this is the last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Check if we should retry this error
        if (config.retryCondition && !config.retryCondition(lastError)) {
          break;
        }

        // Calculate delay
        let delay = config.baseDelay;
        if (config.exponentialBackoff) {
          delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
        }

        // Add jitter to prevent thundering herd
        delay += Math.random() * 1000;

        // Report the retry attempt
        this.reportError(lastError, {
          level: 'warning',
          context: {
            attempt: attempt + 1,
            maxRetries: config.maxRetries,
            nextDelay: delay
          }
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    this.reportError(lastError!, {
      level: 'error',
      context: {
        retriesFailed: config.maxRetries,
        finalAttempt: true
      }
    });

    throw lastError!;
  }

  /**
   * Create a safe wrapper for async operations
   */
  safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context: Record<string, unknown> = {}
  ): Promise<T | undefined> {
    return operation().catch(error => {
      this.reportError(error, { context });
      return fallback;
    });
  }

  /**
   * Get error reports with filtering
   */
  getErrorReports(filters: {
    level?: ErrorReport['level'];
    category?: ErrorReport['category'];
    since?: number;
    limit?: number;
  } = {}): ErrorReport[] {
    let filtered = [...this.errorReports];

    if (filters.level) {
      filtered = filtered.filter(report => report.level === filters.level);
    }

    if (filters.category) {
      filtered = filtered.filter(report => report.category === filters.category);
    }

    if (filters.since) {
      filtered = filtered.filter(report => report.timestamp >= filters.since!);
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byLevel: Record<ErrorReport['level'], number>;
    byCategory: Record<ErrorReport['category'], number>;
    recentErrors: number; // Last hour
  } {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    const stats = {
      total: this.errorReports.length,
      byLevel: { error: 0, warning: 0, info: 0 },
      byCategory: { 
        supabase: 0, 
        network: 0, 
        validation: 0, 
        auth: 0, 
        sync: 0, 
        migration: 0, 
        ui: 0, 
        unknown: 0 
      },
      recentErrors: 0
    };

    this.errorReports.forEach(report => {
      stats.byLevel[report.level]++;
      stats.byCategory[report.category]++;
      
      if (report.timestamp >= oneHourAgo) {
        stats.recentErrors++;
      }
    });

    return stats;
  }

  /**
   * Clear error reports
   */
  clearReports(olderThan?: number): void {
    if (olderThan) {
      this.errorReports = this.errorReports.filter(report => report.timestamp >= olderThan);
    } else {
      this.errorReports = [];
    }
    this.saveReportsToStorage();
  }

  /**
   * Export error reports for analysis
   */
  exportReports(): string {
    return JSON.stringify(this.errorReports, null, 2);
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlingService();

// Hook for React components
export function useErrorHandler() {
  return {
    reportError: (error: Error | string, options?: Parameters<typeof errorHandler.reportError>[1]) =>
      errorHandler.reportError(error, options),
    handleSupabaseError: (error: PostgrestError | Error, context?: Record<string, unknown>) =>
      errorHandler.handleSupabaseError(error, context),
    withRetry: <T>(operation: () => Promise<T>, options?: Partial<RetryOptions>) =>
      errorHandler.withRetry(operation, options),
    safeAsync: <T>(operation: () => Promise<T>, fallback?: T, context?: Record<string, unknown>) =>
      errorHandler.safeAsync(operation, fallback, context),
    getReports: (filters?: Parameters<typeof errorHandler.getErrorReports>[0]) =>
      errorHandler.getErrorReports(filters),
    getStats: () => errorHandler.getErrorStats(),
    clearReports: (olderThan?: number) => errorHandler.clearReports(olderThan)
  };
}
