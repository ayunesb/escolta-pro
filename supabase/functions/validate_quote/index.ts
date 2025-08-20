import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side quote calculation to ensure consistency
const calculateBookingTotal = (
  baseRateCents: number,
  hours: number,
  armedSurchargeCents: number = 0,
  vehicleRateCents: number = 0,
  armoredSurchargeCents: number = 0,
  isArmed: boolean = false,
  hasVehicle: boolean = false,
  isArmored: boolean = false
) => {
  // Enforce minimum 4 hours
  const minHours = Math.max(hours, 4);
  
  let subtotal = baseRateCents * minHours;
  
  if (isArmed && armedSurchargeCents > 0) {
    subtotal += armedSurchargeCents * minHours;
  }
  
  if (hasVehicle && vehicleRateCents > 0) {
    subtotal += vehicleRateCents * minHours;
    
    if (isArmored && armoredSurchargeCents > 0) {
      subtotal += armoredSurchargeCents * minHours;
    }
  }
  
  const serviceFee = Math.round(subtotal * 0.1); // 10% service fee
  const total = subtotal + serviceFee;
  
  return {
    subtotal,
    serviceFee,
    total,
    hours: minHours,
    breakdown: {
      base: baseRateCents * minHours,
      armed: isArmed ? armedSurchargeCents * minHours : 0,
      vehicle: hasVehicle ? vehicleRateCents * minHours : 0,
      armored: isArmored ? armoredSurchargeCents * minHours : 0,
    }
  };
};

serve(async (req) => {
  console.log(`validate_quote: ${req.method} request received`);

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("validate_quote: auth error", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      booking_id,
      guard_id,
      hours,
      armed_required,
      vehicle_required,
      vehicle_type,
      client_total // The total calculated on client side for validation
    } = await req.json();

    console.log("validate_quote: validating quote for booking", booking_id);

    if (!booking_id || !guard_id || !hours || hours < 4) {
      throw new Error("Invalid parameters: booking_id, guard_id, and minimum 4 hours required");
    }

    // Get guard details for pricing
    const { data: guard, error: guardError } = await supabase
      .from("guards")
      .select("hourly_rate_mxn_cents, armed_hourly_surcharge_mxn_cents")
      .eq("id", guard_id)
      .eq("active", true)
      .single();

    if (guardError || !guard) {
      console.error("validate_quote: guard not found", guardError);
      throw new Error("Guard not found or not active");
    }

    let vehicleRateCents = 0;
    let armoredSurchargeCents = 0;

    // Get vehicle pricing if required
    if (vehicle_required && vehicle_type) {
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("vehicle_hourly_rate_mxn_cents, armored_hourly_surcharge_mxn_cents, armored")
        .eq("guard_id", guard_id)
        .eq("type", vehicle_type)
        .eq("active", true)
        .single();

      if (vehicleError || !vehicle) {
        console.error("validate_quote: vehicle not found", vehicleError);
        throw new Error("Requested vehicle not available");
      }

      vehicleRateCents = vehicle.vehicle_hourly_rate_mxn_cents || 0;
      if (vehicle.armored) {
        armoredSurchargeCents = vehicle.armored_hourly_surcharge_mxn_cents || 0;
      }
    }

    // Calculate server-side quote
    const serverQuote = calculateBookingTotal(
      guard.hourly_rate_mxn_cents,
      hours,
      guard.armed_hourly_surcharge_mxn_cents,
      vehicleRateCents,
      armoredSurchargeCents,
      armed_required || false,
      vehicle_required || false,
      armoredSurchargeCents > 0
    );

    // Validate client calculation matches server calculation
    const tolerance = 1; // Allow 1 cent difference due to rounding
    if (client_total && Math.abs(serverQuote.total - client_total) > tolerance) {
      console.warn("validate_quote: price mismatch", {
        server_total: serverQuote.total,
        client_total,
        difference: Math.abs(serverQuote.total - client_total)
      });
      
      return new Response(JSON.stringify({
        error: "Price calculation mismatch",
        server_quote: serverQuote,
        client_total
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store validated quote
    const { error: quoteError } = await supabase
      .from("quotes")
      .upsert({
        booking_id: booking_id,
        payload: {
          guard_id,
          validated_at: new Date().toISOString(),
          quote: serverQuote,
          parameters: {
            hours,
            armed_required,
            vehicle_required,
            vehicle_type
          }
        }
      }, { onConflict: 'booking_id' });

    if (quoteError) {
      console.error("validate_quote: failed to store quote", quoteError);
    }

    console.log("validate_quote: quote validated successfully", {
      booking_id,
      total: serverQuote.total
    });

    return new Response(JSON.stringify({
      valid: true,
      quote: serverQuote,
      guard_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("validate_quote: error", error);
    
    return new Response(JSON.stringify({
      error: error.message || "Failed to validate quote",
      valid: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});