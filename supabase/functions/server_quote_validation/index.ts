import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate booking total with business rules
function calculateBookingTotal(
  baseRateCents: number,
  hours: number,
  armedSurchargeCents: number = 0,
  vehicleRateCents: number = 0,
  armoredSurchargeCents: number = 0,
  isArmed: boolean = false,
  hasVehicle: boolean = false,
  isArmored: boolean = false
) {
  // Enforce minimum 4 hours
  const effectiveHours = Math.max(hours, 4);
  
  let subtotal = baseRateCents * effectiveHours;
  
  if (isArmed && armedSurchargeCents > 0) {
    subtotal += armedSurchargeCents * effectiveHours;
  }
  
  if (hasVehicle && vehicleRateCents > 0) {
    subtotal += vehicleRateCents * effectiveHours;
    
    if (isArmored && armoredSurchargeCents > 0) {
      subtotal += armoredSurchargeCents * effectiveHours;
    }
  }
  
  // 10% service fee
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;
  
  return {
    subtotal,
    serviceFee,
    total,
    effectiveHours,
    breakdown: {
      base: baseRateCents * effectiveHours,
      armed: isArmed ? armedSurchargeCents * effectiveHours : 0,
      vehicle: hasVehicle ? vehicleRateCents * effectiveHours : 0,
      armored: isArmored ? armoredSurchargeCents * effectiveHours : 0,
    }
  };
}

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

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid user token');
    }

    const { 
      guard_id, 
      hours, 
      armed_required, 
      vehicle_required, 
      armored_required,
      client_total_cents 
    } = await req.json();

    // Get guard pricing
    const { data: guard, error: guardError } = await supabaseClient
      .from('guards')
      .select('hourly_rate_mxn_cents, armed_hourly_surcharge_mxn_cents')
      .eq('id', guard_id)
      .single();

    if (guardError || !guard) {
      throw new Error('Guard not found');
    }

    let vehicleRate = 0;
    let armoredSurcharge = 0;

    if (vehicle_required) {
      const { data: vehicle, error: vehicleError } = await supabaseClient
        .from('vehicles')
        .select('vehicle_hourly_rate_mxn_cents, armored_hourly_surcharge_mxn_cents')
        .eq('guard_id', guard_id)
        .eq('active', true)
        .limit(1)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('No vehicle available for this guard');
      }

      vehicleRate = vehicle.vehicle_hourly_rate_mxn_cents || 0;
      armoredSurcharge = vehicle.armored_hourly_surcharge_mxn_cents || 0;
    }

    // Calculate server-side quote
    const serverQuote = calculateBookingTotal(
      guard.hourly_rate_mxn_cents,
      hours,
      guard.armed_hourly_surcharge_mxn_cents || 0,
      vehicleRate,
      armoredSurcharge,
      armed_required,
      vehicle_required,
      armored_required
    );

    // Validate against client calculation (allow 1% tolerance for rounding)
    const tolerance = Math.max(1, Math.round(serverQuote.total * 0.01));
    const isValid = Math.abs(serverQuote.total - client_total_cents) <= tolerance;

    if (!isValid) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Quote mismatch',
          server_total: serverQuote.total,
          client_total: client_total_cents,
          difference: serverQuote.total - client_total_cents
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Store validated quote
    const { error: quoteError } = await supabaseClient
      .from('quotes')
      .insert({
        booking_id: crypto.randomUUID(), // Will be updated with actual booking ID
        payload: {
          guard_id,
          hours: serverQuote.effectiveHours,
          armed_required,
          vehicle_required,
          armored_required,
          quote: serverQuote,
          validated_at: new Date().toISOString(),
          user_id: userData.user.id
        }
      });

    if (quoteError) {
      console.error('Quote storage failed:', quoteError);
    }

    return new Response(
      JSON.stringify({
        valid: true,
        quote: serverQuote
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Quote validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
      }
    );
  }
});