import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetric {
  operation: string;
  duration_ms: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface UseProductionMonitoringOptions {
  enabled?: boolean;
  reportInterval?: number;
  maxQueueSize?: number;
}

export const useProductionMonitoring = (options: UseProductionMonitoringOptions = {}) => {
  const { 
    enabled = process.env.NODE_ENV === 'production',
    reportInterval = 30000, // 30 seconds
    maxQueueSize = 100 
  } = options;

  const metricsQueue = useRef<PerformanceMetric[]>([]);
  const reportIntervalRef = useRef<NodeJS.Timeout>();
  const isReporting = useRef(false);

  // Track page views
  const trackPageView = useCallback((path: string) => {
    if (!enabled) return;

    const metric: PerformanceMetric = {
      operation: 'page_view',
      duration_ms: 0,
      success: true,
      metadata: {
        path,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer
      }
    };

    metricsQueue.current.push(metric);
  }, [enabled]);

  // Track API calls
  const trackApiCall = useCallback((
    endpoint: string, 
    duration: number, 
    success: boolean, 
    error?: string
  ) => {
    if (!enabled) return;

    const metric: PerformanceMetric = {
      operation: 'api_call',
      duration_ms: duration,
      success,
      error,
      metadata: {
        endpoint,
        timestamp: new Date().toISOString()
      }
    };

    metricsQueue.current.push(metric);
  }, [enabled]);

  // Track user interactions
  const trackInteraction = useCallback((
    action: string, 
    element: string, 
    metadata?: Record<string, any>
  ) => {
    if (!enabled) return;

    const metric: PerformanceMetric = {
      operation: 'user_interaction',
      duration_ms: 0,
      success: true,
      metadata: {
        action,
        element,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    metricsQueue.current.push(metric);
  }, [enabled]);

  // Track errors
  const trackError = useCallback((
    error: Error, 
    context: string, 
    metadata?: Record<string, any>
  ) => {
    if (!enabled) return;

    const metric: PerformanceMetric = {
      operation: 'error',
      duration_ms: 0,
      success: false,
      error: error.message,
      metadata: {
        context,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...metadata
      }
    };

    metricsQueue.current.push(metric);
  }, [enabled]);

  // Track performance timing
  const trackTiming = useCallback((
    operation: string,
    startTime: number,
    metadata?: Record<string, any>
  ) => {
    if (!enabled) return;

    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      operation,
      duration_ms: Math.round(duration),
      success: true,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    metricsQueue.current.push(metric);
  }, [enabled]);

  // Report metrics to server
  const reportMetrics = useCallback(async () => {
    if (!enabled || isReporting.current || metricsQueue.current.length === 0) {
      return;
    }

    isReporting.current = true;
    const metricsToReport = [...metricsQueue.current];
    metricsQueue.current = [];

    try {
      const { error } = await supabase.functions.invoke('performance_monitor', {
        body: {
          operation: 'report',
          metrics: metricsToReport
        }
      });

      if (error) {
        console.error('Failed to report metrics:', error);
        // Add metrics back to queue for retry
        metricsQueue.current.unshift(...metricsToReport.slice(-10)); // Keep only last 10 on error
      }
    } catch (error) {
      console.error('Error reporting metrics:', error);
    } finally {
      isReporting.current = false;
    }
  }, [enabled]);

  // Auto-report metrics periodically
  useEffect(() => {
    if (!enabled) return;

    reportIntervalRef.current = setInterval(reportMetrics, reportInterval);

    return () => {
      if (reportIntervalRef.current) {
        clearInterval(reportIntervalRef.current);
      }
    };
  }, [enabled, reportInterval, reportMetrics]);

  // Report metrics when queue gets too large
  useEffect(() => {
    if (metricsQueue.current.length >= maxQueueSize) {
      reportMetrics();
    }
  }, [maxQueueSize, reportMetrics]);

  // Report metrics on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      if (metricsQueue.current.length > 0) {
        // Use sendBeacon for reliable reporting on page unload
        const data = JSON.stringify({
          operation: 'report',
          metrics: metricsQueue.current
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/performance_monitor`,
            data
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  // Collect web vitals
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Track Core Web Vitals when available
    if ('web-vital' in window) {
      // This would typically use a library like web-vitals
      // For now, we'll track basic performance metrics
    }

    // Track resource loading performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          trackTiming('page_load', 0, {
            dns_time: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            connect_time: navEntry.connectEnd - navEntry.connectStart,
            request_time: navEntry.responseStart - navEntry.requestStart,
            response_time: navEntry.responseEnd - navEntry.responseStart,
            dom_load_time: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            total_load_time: navEntry.loadEventEnd - navEntry.loadEventStart
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
    return () => observer.disconnect();
  }, [enabled, trackTiming]);

  return {
    trackPageView,
    trackApiCall,
    trackInteraction,
    trackError,
    trackTiming,
    reportMetrics,
    isEnabled: enabled
  };
};