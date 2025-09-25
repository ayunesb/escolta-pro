import { useState, useEffect, useCallback } from 'react';
// (No direct supabase usage; left placeholder import removed.)

interface SystemMetrics {
  uptime: number;
  activeUsers: number;
  errorRate: number;
  responseTime: number;
  totalBookings: number;
  revenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 99.9,
    activeUsers: 0,
    errorRate: 0.1,
    responseTime: 234,
    totalBookings: 0,
    revenue: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type MetricType = 'response_time' | 'error_rate' | 'active_users' | 'bookings';
  type Metadata = import('@/types/observability').Metadata;

  const trackMetric = useCallback(async (
    type: MetricType,
    value: number,
    metadata?: Metadata
  ) => {
    try {
      console.warn('Tracking metric:', { type, value, metadata });
    } catch (error) {
      console.error('Error tracking metric:', error);
    }
  }, []);

  const trackEvent = useCallback(async (
    event: string,
    properties?: Metadata
  ) => {
    try {
      console.warn('Tracking event:', { event, properties });
      
      if (event === 'booking_completed') {
        setMetrics(prev => ({
          ...prev,
          totalBookings: prev.totalBookings + 1
        }));
      }
    } catch (error: unknown) {
      console.error('Error tracking event:', error instanceof Error ? error.message : error);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const mockMetrics: SystemMetrics = {
        uptime: 99.9,
        activeUsers: Math.floor(Math.random() * 500) + 100,
        errorRate: Math.random() * 0.5,
        responseTime: Math.floor(Math.random() * 100) + 200,
        totalBookings: Math.floor(Math.random() * 1000) + 1000,
        revenue: Math.floor(Math.random() * 100000) + 50000,
        systemHealth: 'healthy'
      };

      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (mockMetrics.errorRate > 2 || mockMetrics.responseTime > 1000) {
        systemHealth = 'warning';
      }
      if (mockMetrics.errorRate > 5 || mockMetrics.responseTime > 2000 || mockMetrics.uptime < 99) {
        systemHealth = 'critical';
      }

      setMetrics({
        ...mockMetrics,
        systemHealth
      });

    } catch (error) {
      console.error('Error loading metrics:', error);
      setError('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    error,
    trackMetric,
    trackEvent,
    loadMetrics
  };
};