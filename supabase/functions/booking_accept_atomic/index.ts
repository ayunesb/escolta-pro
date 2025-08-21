import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid user token');
    }

    const { booking_id } = await req.json();
    if (!booking_id) {
      throw new Error('booking_id is required');
    }

    // Atomic update: only accept if status is exactly 'matching'
    const { data: booking, error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        status: 'assigned',
        assigned_user_id: userData.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .eq('status', 'matching') // Critical: only update if still matching
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Booking no longer available' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          }
        );
      }
      throw updateError;
    }

    // Create assignment record
    const { error: assignmentError } = await supabaseClient
      .from('assignments')
      .insert({
        booking_id: booking_id,
        guard_id: userData.user.id,
        status: 'assigned'
      });

    if (assignmentError) {
      console.error('Assignment creation failed:', assignmentError);
      // Don't fail the request if assignment creation fails, booking is already updated
    }

    return new Response(
      JSON.stringify({ success: true, booking }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Booking accept error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});