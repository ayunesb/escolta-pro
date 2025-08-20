import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Parse request body
    const { 
      pickup_address, 
      start_ts, 
      duration_hours, 
      armed_required, 
      vehicle_required, 
      vehicle_type, 
      notes,
      total_mxn_cents 
    } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.first_name && user.user_metadata?.last_name 
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
          : undefined,
      });
      customerId = customer.id;
    }

    // Create booking first
    const endTime = new Date(start_ts);
    endTime.setHours(endTime.getHours() + duration_hours);

    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .insert({
        client_id: user.id,
        pickup_address,
        start_ts,
        end_ts: endTime.toISOString(),
        min_hours: duration_hours,
        armed_required,
        vehicle_required,
        vehicle_type,
        notes,
        total_mxn_cents,
        status: 'pending_payment',
        currency: 'MXN'
      })
      .select()
      .single();

    if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: { 
              name: "Security Service Booking",
              description: `Protection service for ${duration_hours} hours at ${pickup_address}`,
            },
            unit_amount: total_mxn_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/booking-success?booking_id=${booking.id}`,
      cancel_url: `${req.headers.get("origin")}/booking-cancelled?booking_id=${booking.id}`,
      metadata: {
        booking_id: booking.id,
        user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      booking_id: booking.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Booking payment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});