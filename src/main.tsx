import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryContextProvider } from './contexts/QueryContext'
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

// Production performance monitoring
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Disable console logs in production
  console.log = () => {};
  console.warn = () => {};
  
  // Global error handler
  window.addEventListener('error', (event) => {
    // Report to monitoring service if URL is available
    const supabaseUrl = 'https://isnezquuwepqcjkaupjh.supabase.co';
    if (supabaseUrl) {
      fetch(`${supabaseUrl}/functions/v1/performance_monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'report',
          metrics: [{
            operation: 'global_error',
            duration_ms: 0,
            success: false,
            error: event.error?.message || 'Unknown error',
            metadata: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
              stack: event.error?.stack,
              timestamp: new Date().toISOString(),
              app: 'main'
            }
          }]
        })
      }).catch(() => {}); // Silently fail to avoid error loops
    }
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const supabaseUrl = 'https://isnezquuwepqcjkaupjh.supabase.co';
    if (supabaseUrl) {
      fetch(`${supabaseUrl}/functions/v1/performance_monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'report',
          metrics: [{
            operation: 'unhandled_rejection',
            duration_ms: 0,
            success: false,
            error: event.reason?.message || 'Unhandled promise rejection',
            metadata: {
              reason: String(event.reason),
              timestamp: new Date().toISOString(),
              app: 'main'
            }
          }]
        })
      }).catch(() => {});
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AccessibilityProvider>
        <QueryContextProvider>
          <App />
        </QueryContextProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
