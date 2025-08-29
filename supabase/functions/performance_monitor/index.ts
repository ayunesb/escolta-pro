import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PerformanceMetric {
  operation: string;
  duration_ms: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  console.log(`performance_monitor: ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only require authentication for 'query' operation
    let supabase;
    if (operation === 'query') {
      supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
    } else {
      // For 'report', allow public insert
      supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
    }

    const { metrics, operation }: { 
      metrics?: PerformanceMetric[], 
      operation?: 'report' | 'query'
    } = await req.json();

    if (operation === 'report' && metrics?.length) {
      // Report performance metrics
      console.log("performance_monitor: reporting metrics", metrics.length);
      
      // Store metrics in audit_logs for analysis
      const auditEntries = metrics.map(metric => ({
        action: 'performance_metric',
        entity: 'system',
        diff: {
          operation: metric.operation,
          duration_ms: metric.duration_ms,
          success: metric.success,
          error: metric.error,
          metadata: metric.metadata || {},
          timestamp: new Date().toISOString()
        }
      }));

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert(auditEntries);

      if (auditError) {
        console.error("performance_monitor: failed to store metrics", auditError);
      }

      // Calculate basic stats
      const successfulMetrics = metrics.filter(m => m.success);
      const failedMetrics = metrics.filter(m => !m.success);
      
      const avgDuration = successfulMetrics.length > 0 
        ? successfulMetrics.reduce((sum, m) => sum + m.duration_ms, 0) / successfulMetrics.length
        : 0;

      const stats = {
        total_operations: metrics.length,
        successful_operations: successfulMetrics.length,
        failed_operations: failedMetrics.length,
        success_rate: metrics.length > 0 ? (successfulMetrics.length / metrics.length) * 100 : 0,
        average_duration_ms: Math.round(avgDuration),
        operations_by_type: metrics.reduce((acc, m) => {
          acc[m.operation] = (acc[m.operation] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      console.log("performance_monitor: performance stats", stats);

      return new Response(JSON.stringify({
        success: true,
        metrics_recorded: metrics.length,
        stats
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (operation === 'query') {
      // Query recent performance data
      const { data: recentMetrics, error: queryError } = await supabase
        .from('audit_logs')
        .select('diff, ts')
        .eq('action', 'performance_metric')
        .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('ts', { ascending: false })
        .limit(1000);

      if (queryError) {
        console.error("performance_monitor: query error", queryError);
        throw new Error("Failed to query performance metrics");
      }

      // Process metrics for analysis
      const processedMetrics = recentMetrics?.map(log => ({
        operation: log.diff.operation,
        duration_ms: log.diff.duration_ms,
        success: log.diff.success,
        timestamp: log.ts,
        error: log.diff.error,
        metadata: log.diff.metadata
      })) || [];

      // Group by operation type and calculate stats
      const operationStats = processedMetrics.reduce((acc, metric) => {
        const { operation, duration_ms, success } = metric;
        
        if (!acc[operation]) {
          acc[operation] = {
            total_count: 0,
            success_count: 0,
            durations: [],
            latest_timestamp: metric.timestamp
          };
        }
        
        acc[operation].total_count++;
        if (success) acc[operation].success_count++;
        acc[operation].durations.push(duration_ms);
        
        if (new Date(metric.timestamp) > new Date(acc[operation].latest_timestamp)) {
          acc[operation].latest_timestamp = metric.timestamp;
        }
        
        return acc;
      }, {} as Record<string, any>);

      // Calculate final stats
      const finalStats = Object.entries(operationStats).map(([operation, stats]) => {
        const durations = stats.durations.sort((a: number, b: number) => a - b);
        return {
          operation,
          total_count: stats.total_count,
          success_rate: (stats.success_count / stats.total_count) * 100,
          avg_duration_ms: Math.round(durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length),
          p50_duration_ms: durations[Math.floor(durations.length * 0.5)] || 0,
          p95_duration_ms: durations[Math.floor(durations.length * 0.95)] || 0,
          p99_duration_ms: durations[Math.floor(durations.length * 0.99)] || 0,
          latest_timestamp: stats.latest_timestamp
        };
      });

      return new Response(JSON.stringify({
        success: true,
        time_range: "24h",
        total_metrics: processedMetrics.length,
        operation_stats: finalStats
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error("Invalid operation. Use 'report' to submit metrics or 'query' to get performance data");
    }

  } catch (error) {
    console.error("performance_monitor: error", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Performance monitoring error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});