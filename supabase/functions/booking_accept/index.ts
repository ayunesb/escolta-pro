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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("booking_accept: auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { booking_id }: { booking_id: string } = await req.json();

    console.log("booking_accept: user", user.id, "attempting to accept booking", booking_id);

    // ensure booking is still available
    const { data: b, error: e1 } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (e1 || !b) {
      console.error("booking_accept: booking not found", e1);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (b.status !== "matching") {
      console.error("booking_accept: booking not available, status:", b.status);
      return new Response(JSON.stringify({ error: "Not available" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TODO: optional capability checks (armed/vehicle)

    // First, check if user already has this booking assigned (idempotency)
    const { data: existingAssignment } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .eq("assigned_user_id", user.id)
      .eq("status", "assigned")
      .maybeSingle();

    if (existingAssignment) {
      console.log("booking_accept: booking already assigned to this user", booking_id);
      return new Response(JSON.stringify(existingAssignment), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Attempt atomic update
    const { data: updateResult, error: updateError } = await supabase
      .from("bookings")
      .update({ status: "assigned", assigned_user_id: user.id })
      .eq("id", booking_id)
      .eq("status", "matching") // only update if still matching
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("booking_accept: database error during update", updateError);
      return new Response(JSON.stringify({ error: "Database error occurred" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!updateResult) {
      console.error("booking_accept: booking no longer in matching status or race condition occurred");
      return new Response(JSON.stringify({ error: "Booking no longer available" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("booking_accept: successfully assigned booking", booking_id, "to user", user.id);

    return new Response(JSON.stringify(updateResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("booking_accept: unexpected error", e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});