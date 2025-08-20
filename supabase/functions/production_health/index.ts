import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  details?: Record<string, any>;
}

serve(async (req) => {
  console.log(`production_health: ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  const healthChecks: HealthCheck[] = [];

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check database connectivity
    const dbStart = performance.now();
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      healthChecks.push({
        service: 'database',
        status: dbError ? 'unhealthy' : 'healthy',
        response_time_ms: Math.round(performance.now() - dbStart),
        details: dbError ? { error: dbError.message } : undefined
      });
    } catch (error) {
      healthChecks.push({
        service: 'database',
        status: 'unhealthy',
        response_time_ms: Math.round(performance.now() - dbStart),
        details: { error: error.message }
      });
    }

    // Check authentication service
    const authStart = performance.now();
    try {
      const { error: authError } = await supabase.auth.getSession();
      
      healthChecks.push({
        service: 'authentication',
        status: authError ? 'degraded' : 'healthy',
        response_time_ms: Math.round(performance.now() - authStart),
        details: authError ? { error: authError.message } : undefined
      });
    } catch (error) {
      healthChecks.push({
        service: 'authentication',
        status: 'unhealthy',
        response_time_ms: Math.round(performance.now() - authStart),
        details: { error: error.message }
      });
    }

    // Check Stripe connectivity
    const stripeStart = performance.now();
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const response = await fetch('https://api.stripe.com/v1/balance', {
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
          },
        });

        healthChecks.push({
          service: 'stripe',
          status: response.ok ? 'healthy' : 'degraded',
          response_time_ms: Math.round(performance.now() - stripeStart),
          details: response.ok ? undefined : { status: response.status }
        });
      } else {
        healthChecks.push({
          service: 'stripe',
          status: 'unhealthy',
          response_time_ms: 0,
          details: { error: 'Stripe key not configured' }
        });
      }
    } catch (error) {
      healthChecks.push({
        service: 'stripe',
        status: 'unhealthy',
        response_time_ms: Math.round(performance.now() - stripeStart),
        details: { error: error.message }
      });
    }

    // Check critical business functions
    const functionsToCheck = [
      'validate_quote',
      'create_payment_intent',
      'booking_accept',
      'performance_monitor'
    ];

    for (const funcName of functionsToCheck) {
      const funcStart = performance.now();
      try {
        // Simple health check - just verify the function exists and responds
        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/${funcName}`,
          {
            method: 'OPTIONS',
            headers: {
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
          }
        );

        healthChecks.push({
          service: `function_${funcName}`,
          status: response.ok ? 'healthy' : 'degraded',
          response_time_ms: Math.round(performance.now() - funcStart),
        });
      } catch (error) {
        healthChecks.push({
          service: `function_${funcName}`,
          status: 'unhealthy',
          response_time_ms: Math.round(performance.now() - funcStart),
          details: { error: error.message }
        });
      }
    }

    // Calculate overall system health
    const healthyCount = healthChecks.filter(check => check.status === 'healthy').length;
    const totalChecks = healthChecks.length;
    const healthPercentage = (healthyCount / totalChecks) * 100;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthPercentage >= 90) {
      overallStatus = 'healthy';
    } else if (healthPercentage >= 70) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const totalResponseTime = Math.round(performance.now() - startTime);

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: Deno.env.get("SUPABASE_URL")?.includes('localhost') ? 'development' : 'production',
      response_time_ms: totalResponseTime,
      health_percentage: Math.round(healthPercentage),
      checks: healthChecks,
      summary: {
        total_checks: totalChecks,
        healthy: healthyCount,
        degraded: healthChecks.filter(check => check.status === 'degraded').length,
        unhealthy: healthChecks.filter(check => check.status === 'unhealthy').length
      }
    };

    console.log(`production_health: completed in ${totalResponseTime}ms - ${overallStatus} (${healthPercentage}%)`);

    // Return appropriate HTTP status based on health
    let httpStatus = 200;
    if (overallStatus === 'degraded') httpStatus = 207; // Multi-Status
    if (overallStatus === 'unhealthy') httpStatus = 503; // Service Unavailable

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: httpStatus,
    });

  } catch (error) {
    console.error("production_health: critical error", error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      response_time_ms: Math.round(performance.now() - startTime)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 503,
    });
  }
});