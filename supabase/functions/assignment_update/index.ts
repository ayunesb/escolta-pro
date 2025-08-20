import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignmentUpdateRequest {
  assignmentId: string;
  status: 'offered' | 'accepted' | 'in_progress' | 'on_site' | 'completed';
  location?: {
    lat: number;
    lng: number;
  };
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

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { assignmentId, status, location }: AssignmentUpdateRequest = await req.json();

    if (!assignmentId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the assignment belongs to the user
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('assignments')
      .select('*, bookings(*)')
      .eq('id', assignmentId)
      .eq('guard_id', user.id)
      .single();

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: 'Assignment not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updates: any = { status };
    const timestamp = new Date().toISOString();

    // Set appropriate timestamps based on status
    switch (status) {
      case 'accepted':
        updates.check_in_ts = timestamp;
        break;
      case 'in_progress':
        updates.in_progress_ts = timestamp;
        break;
      case 'on_site':
        updates.on_site_ts = timestamp;
        break;
      case 'completed':
        updates.check_out_ts = timestamp;
        break;
    }

    // Add location to GPS trail if provided
    if (location && (status === 'accepted' || status === 'in_progress' || status === 'on_site')) {
      const currentTrail = assignment.gps_trail || [];
      const newTrailPoint = {
        lat: location.lat,
        lng: location.lng,
        timestamp: timestamp
      };
      updates.gps_trail = [...currentTrail, newTrailPoint];
    }

    // Update the assignment
    const { data: updatedAssignment, error: updateError } = await supabaseClient
      .from('assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update assignment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the status change for audit
    await supabaseClient
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'assignment_status_update',
        entity: 'assignment',
        entity_id: assignmentId,
        diff: {
          previous_status: assignment.status,
          new_status: status,
          timestamp: timestamp
        }
      });

    console.log(`Assignment ${assignmentId} status updated to ${status} by user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        assignment: updatedAssignment,
        message: `Assignment status updated to ${status}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating assignment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});