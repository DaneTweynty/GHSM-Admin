/* eslint-disable react-refresh/only-export-components */
import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        level: this.props.level || 'component',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous',
      },
      state: this.state,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', errorReport);
    }

    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      try {
        console.error('Production error:', errorReport);
        // TODO: Send to error reporting service like Sentry
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ 
      retryCount: retryCount + 1 
    });

    // Clear the error after a short delay to trigger a re-render
    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    }, 100);
  };

  private handleReload = () => {
    window.location.reload();
  };

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  private renderFallback() {
    const { level = 'component' } = this.props;
    const { error, errorId, retryCount } = this.state;
    const canRetry = retryCount < this.maxRetries;

    // Custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Different fallbacks based on error level
    switch (level) {
      case 'critical':
        return (
          <div className="min-h-screen flex items-center justify-center bg-surface-main dark:bg-slate-900">
            <div className="max-w-md w-full bg-surface-card dark:bg-slate-800 shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-3">⚠️</span>
                <h1 className="text-xl font-semibold text-text-primary dark:text-slate-200">
                  Critical Error
                </h1>
              </div>
              <p className="text-text-secondary dark:text-slate-400 mb-4">
                A critical error has occurred. The application needs to be reloaded.
              </p>
              <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded mb-4">
                <p className="text-sm text-gray-700 dark:text-slate-300 font-mono">
                  Error ID: {errorId}
                </p>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {error.message}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Reload Application
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        );

      case 'page':
        return (
          <div className="min-h-96 flex items-center justify-center">
            <div className="max-w-md w-full bg-surface-card dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">⚠️</span>
                <h2 className="text-lg font-semibold text-text-primary dark:text-slate-200">
                  Page Error
                </h2>
              </div>
              <p className="text-text-secondary dark:text-slate-400 mb-4">
                This page encountered an error and couldn't load properly.
              </p>
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded mb-4">
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Error ID: {errorId}
                </p>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {error.message}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    🔄 Try Again ({this.maxRetries - retryCount} left)
                  </button>
                )}
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        );

      case 'component':
      default:
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">⚠️</span>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Component Error
              </h3>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              This component encountered an error. You can try refreshing or continue using other parts of the application.
            </p>
            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded mb-3">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Error ID: {errorId}
              </p>
            </div>
            <div className="flex space-x-2">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                >
                  🔄 Retry ({this.maxRetries - retryCount} left)
                </button>
              )}
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
    }
  }

  override render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    console.error('Async error caught:', error, context);
    
    // Create a synthetic error boundary trigger
    throw error;
  }, []);

  return { handleError };
}

export default ErrorBoundary;
