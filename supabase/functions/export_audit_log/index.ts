import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  filters: {
    startDate?: string;
    endDate?: string;
    action?: string;
    entity?: string;
    actorId?: string;
  };
  format: 'csv' | 'json';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user has admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has company_admin role
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !userRoles?.some(r => r.role === 'company_admin')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { filters, format }: ExportRequest = await req.json();

    console.log(`Exporting audit log in ${format} format for user ${user.id}`);

    // Build query with filters
    let query = supabaseClient
      .from('audit_logs')
      .select(`
        id,
        action,
        entity,
        entity_id,
        actor_id,
        ts,
        diff,
        profiles!audit_logs_actor_id_fkey (email)
      `)
      .order('ts', { ascending: false })
      .limit(10000); // Limit to prevent excessive exports

    // Apply filters
    if (filters.startDate) {
      query = query.gte('ts', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('ts', filters.endDate);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.entity) {
      query = query.eq('entity', filters.entity);
    }
    if (filters.actorId) {
      query = query.eq('actor_id', filters.actorId);
    }

    const { data: auditEntries, error: queryError } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch audit entries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!auditEntries || auditEntries.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No audit entries found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let content: string;
    let contentType: string;

    if (format === 'csv') {
      // Generate CSV content
      const headers = ['Timestamp', 'Action', 'Entity', 'Entity ID', 'Actor Email', 'Actor ID', 'Changes'];
      const csvRows = [headers.join(',')];

      auditEntries.forEach(entry => {
        const row = [
          entry.ts || '',
          entry.action || '',
          entry.entity || '',
          entry.entity_id || '',
          (entry.profiles as any)?.email || '',
          entry.actor_id || '',
          JSON.stringify(entry.diff || {}).replace(/"/g, '""') // Escape quotes for CSV
        ];
        csvRows.push(row.map(field => `"${field}"`).join(','));
      });

      content = csvRows.join('\n');
      contentType = 'text/csv';
    } else {
      // Generate JSON content
      const jsonData = auditEntries.map(entry => ({
        timestamp: entry.ts,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entity_id,
        actorEmail: (entry.profiles as any)?.email,
        actorId: entry.actor_id,
        changes: entry.diff || {}
      }));

      content = JSON.stringify(jsonData, null, 2);
      contentType = 'application/json';
    }

    // Log the export
    await supabaseClient
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'audit_export',
        entity: 'audit_logs',
        entity_id: 'export',
        diff: {
          format,
          filters,
          entries_count: auditEntries.length
        }
      });

    console.log(`Audit log exported successfully. ${auditEntries.length} entries in ${format} format.`);

    return new Response(
      JSON.stringify({
        success: true,
        content: content,
        format: format,
        entries_count: auditEntries.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error exporting audit log:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});