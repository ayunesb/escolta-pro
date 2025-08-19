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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const body = await req.json();
    const { location, start, end, duration_hours, pid, protector_id, vehicle_id, armed, with_vehicle, armored_level } = body || {};

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("bookings: auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("bookings: creating booking for user", user.id);
    console.log("bookings: payload", { location, start, end, duration_hours, protector_id, vehicle_id, armed, with_vehicle });

    // Fetch pricing from database to prevent client tampering
    let hourly_rate_mxn_cents = 80000; // Default $800 MXN/hr
    let armed_hourly_surcharge_mxn_cents = 20000; // Default $200 MXN/hr
    let vehicle_hourly_rate_mxn_cents = 0;
    let armored_hourly_surcharge_mxn_cents = 0;

    // Get protector pricing if specific protector selected
    if (protector_id) {
      const { data: guard } = await supabase
        .from('guards')
        .select('hourly_rate_mxn_cents, armed_hourly_surcharge_mxn_cents')
        .eq('id', protector_id)
        .single();
      
      if (guard) {
        hourly_rate_mxn_cents = guard.hourly_rate_mxn_cents || 80000;
        armed_hourly_surcharge_mxn_cents = guard.armed_hourly_surcharge_mxn_cents || 20000;
      }
    }

    // Get vehicle pricing if vehicle selected
    if (with_vehicle && vehicle_id) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('vehicle_hourly_rate_mxn_cents, armored_hourly_surcharge_mxn_cents')
        .eq('id', vehicle_id)
        .single();
      
      if (vehicle) {
        vehicle_hourly_rate_mxn_cents = vehicle.vehicle_hourly_rate_mxn_cents || 350000;
        armored_hourly_surcharge_mxn_cents = vehicle.armored_hourly_surcharge_mxn_cents || 150000;
      }
    } else if (with_vehicle) {
      // Use default vehicle pricing if no specific vehicle selected
      vehicle_hourly_rate_mxn_cents = 350000; // $3,500 MXN/hr
      armored_hourly_surcharge_mxn_cents = 150000; // $1,500 MXN/hr
    }

    // Calculate pricing (server-side truth)
    const hours = duration_hours || 4;
    const base = hourly_rate_mxn_cents * hours;
    const armedFee = armed ? armed_hourly_surcharge_mxn_cents * hours : 0;
    const vehicleBase = with_vehicle ? vehicle_hourly_rate_mxn_cents * hours : 0;
    const armoredFee = (with_vehicle && armored_level && armored_level !== 'None') 
      ? armored_hourly_surcharge_mxn_cents * hours : 0;

    const subtotal_mxn_cents = base + armedFee + vehicleBase + armoredFee;
    const service_fee_mxn_cents = Math.round(subtotal_mxn_cents * 0.10);
    const total_mxn_cents = subtotal_mxn_cents + service_fee_mxn_cents;

    const payload: any = {
      client_id: user.id,
      start_ts: start ? new Date(start).toISOString() : null,
      end_ts: end ? new Date(end).toISOString() : null,
      pickup_address: location || null,
      status: "requested",
      notes: null,
      armed_required: armed || false,
      vehicle_required: with_vehicle || false,
      vehicle_type: vehicle_id ? 'assigned' : (with_vehicle ? 'suv' : null),
      currency: 'MXN',
      subtotal_mxn_cents,
      service_fee_mxn_cents,
      total_mxn_cents,
    };

    console.log("bookings: inserting payload", payload);

    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("bookings: insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("bookings: successfully created booking", data?.id);

    return new Response(JSON.stringify({ 
      ok: true, 
      booking_id: data?.id,
      subtotal_mxn_cents,
      service_fee_mxn_cents,
      total_mxn_cents
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("bookings: unexpected error", e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
