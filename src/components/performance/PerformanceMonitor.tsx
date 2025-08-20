import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Database, Wifi } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  realtimeConnections: number;
  cacheHitRate: number;
  networkLatency: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    realtimeConnections: 0,
    cacheHitRate: 0,
    networkLatency: 0
  });

  useEffect(() => {
    // Simulate performance monitoring
    const updateMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      setMetrics({
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        realtimeConnections: 2, // Mock data - in reality would track Supabase channels
        cacheHitRate: 85 + Math.random() * 10, // Mock cache performance
        networkLatency: 50 + Math.random() * 100 // Mock network latency
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, []);

  const getPerformanceStatus = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'default';
    if (value <= thresholds[1]) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-mobile-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Load Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-mobile-sm">Page Load</span>
          </div>
          <Badge variant={getPerformanceStatus(metrics.loadTime, [100, 300])}>
            {metrics.loadTime.toFixed(0)}ms
          </Badge>
        </div>

        {/* Real-time Connections */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span className="text-mobile-sm">Live Connections</span>
          </div>
          <Badge variant="outline">
            {metrics.realtimeConnections} active
          </Badge>
        </div>

        {/* Cache Hit Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-mobile-sm">Cache Performance</span>
          </div>
          <Badge variant={metrics.cacheHitRate > 80 ? 'default' : 'secondary'}>
            {metrics.cacheHitRate.toFixed(0)}%
          </Badge>
        </div>

        {/* Network Latency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-mobile-sm">Network Latency</span>
          </div>
          <Badge variant={getPerformanceStatus(metrics.networkLatency, [100, 200])}>
            {metrics.networkLatency.toFixed(0)}ms
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};