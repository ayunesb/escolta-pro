import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HapticButton from '@/components/mobile/HapticButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to performance monitoring function
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/performance_monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'report',
          metrics: [{
            operation: 'error_boundary',
            duration_ms: 0,
            success: false,
            error: error.message,
            metadata: {
              error_id: this.state.errorId,
              stack: error.stack,
              component_stack: errorInfo.componentStack,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
              url: window.location.href
            }
          }]
        })
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorId: '' });
    } else {
      // Redirect to home after max retries
      window.location.href = '/';
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-mobile">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-mobile-lg">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-mobile-sm text-muted-foreground text-center">
                We encountered an unexpected error. This has been reported to our team.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {this.state.error.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {this.retryCount < this.maxRetries ? (
                  <HapticButton
                    onClick={this.handleRetry}
                    className="w-full"
                    hapticPattern="medium"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </HapticButton>
                ) : (
                  <HapticButton
                    onClick={this.handleGoHome}
                    className="w-full"
                    hapticPattern="medium"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Home
                  </HapticButton>
                )}
              </div>

              {process.env.NODE_ENV === 'production' && (
                <p className="text-xs text-muted-foreground text-center">
                  If this persists, please contact support with error ID: {this.state.errorId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;