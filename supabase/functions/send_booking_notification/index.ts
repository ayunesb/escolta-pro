import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role to send notifications
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { 
      user_id, 
      booking_id, 
      type, 
      title, 
      message, 
      action_url,
      metadata = {} 
    } = await req.json();

    console.log('Sending notification:', { user_id, booking_id, type, title });

    // Send notification using the database function
    const { data, error } = await supabase.rpc('send_notification', {
      p_user_id: user_id,
      p_booking_id: booking_id,
      p_type: type,
      p_title: title,
      p_message: message,
      p_action_url: action_url,
      p_metadata: metadata
    });

    if (error) {
      console.error('Error sending notification:', error);
      throw error;
    }

    console.log('Notification sent successfully:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      notification_id: data 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});