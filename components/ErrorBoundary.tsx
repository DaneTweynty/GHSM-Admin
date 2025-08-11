import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You can add error reporting service here
    // reportErrorToService(error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-main dark:bg-slate-900">
          <div className="max-w-md w-full bg-surface-card dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-text-primary dark:text-slate-200 mb-2">
                Something went wrong
              </h1>
              <p className="text-text-secondary dark:text-slate-400 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg font-medium transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="w-full px-4 py-2 bg-surface-hover dark:bg-slate-700 text-text-primary dark:text-slate-200 rounded-lg font-medium transition-colors hover:bg-surface-border dark:hover:bg-slate-600"
                >
                  Try Again
                </button>
              </div>
              {this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-text-tertiary dark:text-slate-500 hover:text-text-secondary dark:hover:text-slate-400">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded border text-red-800 dark:text-red-200 overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;
