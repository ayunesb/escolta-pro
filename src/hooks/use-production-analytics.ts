import { useEffect, useCallback } from 'react';
import { useProductionMonitoring } from './use-production-monitoring';
import { useAuth } from '@/contexts/AuthContext';

export const useProductionAnalytics = () => {
  const { trackPageView, trackInteraction, trackError, trackTiming } = useProductionMonitoring();
  const { user } = useAuth();

  // Track page views with user context
  const trackPage = useCallback((path: string, title?: string) => {
    trackPageView(path);
    
    // Track additional context for authenticated users
    if (user) {
      trackInteraction('page_view', path, {
        user_id: user.id,
        user_role: user.role || 'unknown',
        page_title: title || document.title,
        session_duration: Date.now() - (performance.timeOrigin || 0)
      });
    }
  }, [trackPageView, trackInteraction, user]);

  // Track business events
  const trackBookingEvent = useCallback((
    event: 'started' | 'completed' | 'cancelled',
    bookingId?: string,
    metadata?: Record<string, any>
  ) => {
    trackInteraction(`booking_${event}`, 'booking_flow', {
      booking_id: bookingId,
      user_id: user?.id,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }, [trackInteraction, user]);

  const trackPaymentEvent = useCallback((
    event: 'initiated' | 'completed' | 'failed',
    amount?: number,
    metadata?: Record<string, any>
  ) => {
    trackInteraction(`payment_${event}`, 'payment_flow', {
      amount,
      user_id: user?.id,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }, [trackInteraction, user]);

  const trackAuthEvent = useCallback((
    event: 'login' | 'logout' | 'signup' | 'password_reset',
    method?: string
  ) => {
    trackInteraction(`auth_${event}`, 'authentication', {
      method,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [trackInteraction, user]);

  // Track feature usage
  const trackFeatureUsage = useCallback((
    feature: string,
    action: string,
    metadata?: Record<string, any>
  ) => {
    trackInteraction(action, feature, {
      user_id: user?.id,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }, [trackInteraction, user]);

  // Track search and filtering
  const trackSearch = useCallback((
    query: string,
    results: number,
    filters?: Record<string, any>
  ) => {
    trackInteraction('search', 'search_system', {
      query,
      results_count: results,
      filters,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [trackInteraction, user]);

  // Track critical errors with business context
  const trackBusinessError = useCallback((
    error: Error,
    context: 'booking' | 'payment' | 'auth' | 'general',
    metadata?: Record<string, any>
  ) => {
    trackError(error, context, {
      user_id: user?.id,
      user_role: user?.role,
      business_context: context,
      ...metadata
    });
  }, [trackError, user]);

  // Track performance with business metrics
  const trackBusinessTiming = useCallback((
    operation: 'booking_flow' | 'payment_flow' | 'search' | 'page_load',
    startTime: number,
    metadata?: Record<string, any>
  ) => {
    trackTiming(operation, startTime, {
      user_id: user?.id,
      ...metadata
    });
  }, [trackTiming, user]);

  // Auto-track route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const title = document.title;
      trackPage(path, title);
    };

    // Track initial page load
    handleRouteChange();

    // Listen for route changes (works with most SPA routers)
    window.addEventListener('popstate', handleRouteChange);
    
    // Also listen for pushState/replaceState (for programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [trackPage]);

  return {
    trackPage,
    trackBookingEvent,
    trackPaymentEvent,
    trackAuthEvent,
    trackFeatureUsage,
    trackSearch,
    trackBusinessError,
    trackBusinessTiming
  };
};