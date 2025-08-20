import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  type: 'financial' | 'operational' | 'performance' | 'compliance';
  format: 'pdf' | 'excel' | 'csv';
  dateRange: {
    from: string;
    to: string;
  };
  includeCharts: boolean;
  filters: {
    status?: string[];
    guardIds?: string[];
    cities?: string[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the session user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const reportRequest: ReportRequest = await req.json();

    console.log(`Generating ${reportRequest.type} report for user ${user.id}`);

    // Fetch data based on report type
    let reportData: any = {};

    switch (reportRequest.type) {
      case 'financial':
        reportData = await generateFinancialReport(supabaseClient, user.id, reportRequest);
        break;
      case 'operational':
        reportData = await generateOperationalReport(supabaseClient, user.id, reportRequest);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(supabaseClient, user.id, reportRequest);
        break;
      case 'compliance':
        reportData = await generateComplianceReport(supabaseClient, user.id, reportRequest);
        break;
    }

    // Generate report file (simplified - in production, use proper report generation library)
    const reportContent = generateReportContent(reportData, reportRequest);

    // In a real implementation, you would:
    // 1. Generate actual PDF/Excel/CSV files
    // 2. Upload to storage
    // 3. Return download URL
    
    // For now, return mock response
    const downloadUrl = `https://example.com/reports/${reportRequest.type}-${Date.now()}.${reportRequest.format}`;

    console.log(`Report generated successfully: ${downloadUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl,
        reportData: reportContent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating report:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate report',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function generateFinancialReport(supabase: any, userId: string, request: ReportRequest) {
  // Fetch bookings and payments
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      payments (
        amount_captured,
        amount_preauth,
        status,
        created_at
      )
    `)
    .eq('client_id', userId)
    .gte('created_at', request.dateRange.from)
    .lte('created_at', request.dateRange.to);

  const totalRevenue = bookings?.reduce((sum: number, booking: any) => {
    const payment = booking.payments?.find((p: any) => p.status === 'succeeded');
    return sum + (payment?.amount_captured || 0);
  }, 0) || 0;

  const averageBookingValue = bookings?.length > 0 ? totalRevenue / bookings.length : 0;

  return {
    summary: {
      totalBookings: bookings?.length || 0,
      totalRevenue: totalRevenue / 100,
      averageBookingValue: averageBookingValue / 100,
    },
    bookings: bookings || [],
    period: request.dateRange,
  };
}

async function generateOperationalReport(supabase: any, userId: string, request: ReportRequest) {
  // Fetch assignments and operational data
  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      *,
      bookings!inner (
        *,
        client_id
      ),
      guards (
        id,
        user:user_id (
          first_name,
          last_name
        )
      )
    `)
    .eq('bookings.client_id', userId)
    .gte('bookings.created_at', request.dateRange.from)
    .lte('bookings.created_at', request.dateRange.to);

  const completionRate = assignments?.length > 0 
    ? (assignments.filter((a: any) => a.status === 'completed').length / assignments.length) * 100 
    : 0;

  return {
    summary: {
      totalAssignments: assignments?.length || 0,
      completionRate,
      averageResponseTime: '15 minutes', // Placeholder
    },
    assignments: assignments || [],
    period: request.dateRange,
  };
}

async function generatePerformanceReport(supabase: any, userId: string, request: ReportRequest) {
  // Fetch performance metrics
  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      *,
      bookings!inner (
        client_id,
        start_ts
      ),
      guards (
        rating,
        user:user_id (
          first_name,
          last_name
        )
      )
    `)
    .eq('bookings.client_id', userId)
    .gte('bookings.created_at', request.dateRange.from)
    .lte('bookings.created_at', request.dateRange.to);

  const averageRating = assignments?.length > 0
    ? assignments.reduce((sum: number, a: any) => sum + (a.guards?.rating || 0), 0) / assignments.length
    : 0;

  return {
    summary: {
      averageRating,
      totalAssignments: assignments?.length || 0,
      onTimePerformance: 95, // Placeholder calculation
    },
    assignments: assignments || [],
    period: request.dateRange,
  };
}

async function generateComplianceReport(supabase: any, userId: string, request: ReportRequest) {
  // Fetch compliance-related data
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .gte('ts', request.dateRange.from)
    .lte('ts', request.dateRange.to)
    .order('ts', { ascending: false });

  const { data: incidents } = await supabase
    .from('incidents')
    .select(`
      *,
      bookings!inner (
        client_id
      )
    `)
    .eq('bookings.client_id', userId)
    .gte('created_at', request.dateRange.from)
    .lte('created_at', request.dateRange.to);

  return {
    summary: {
      totalAuditEvents: auditLogs?.length || 0,
      totalIncidents: incidents?.length || 0,
      complianceScore: 98, // Placeholder calculation
    },
    auditLogs: auditLogs || [],
    incidents: incidents || [],
    period: request.dateRange,
  };
}

function generateReportContent(data: any, request: ReportRequest) {
  // Generate report content based on format
  const content = {
    title: `${request.type.charAt(0).toUpperCase()}${request.type.slice(1)} Report`,
    generatedAt: new Date().toISOString(),
    period: request.dateRange,
    data,
    format: request.format,
    includeCharts: request.includeCharts,
  };

  return content;
}