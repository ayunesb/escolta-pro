import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './admin/AdminApp.tsx';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import './index.css';

if (import.meta.env.DEV) console.warn('🚀 Admin app initializing...');

// Production performance monitoring
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Disable console logs in production
  // eslint-disable-next-line no-console
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
              app: 'admin'
            }
          }]
        })
      }).catch(() => {}); // Silently fail to avoid error loops
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AccessibilityProvider>
        <AdminApp />
      </AccessibilityProvider>
    </ErrorBoundary>
  </StrictMode>,
);