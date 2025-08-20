import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import Stripe from 'https://esm.sh/stripe@14.9.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { booking_id, amount, quote_validation } = await req.json();

    if (!booking_id || !amount || amount <= 0) {
      throw new Error('Invalid booking_id or amount');
    }

    // Verify booking ownership and get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, total_mxn_cents')
      .eq('id', booking_id)
      .eq('client_id', user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found or access denied');
    }

    // Validate booking is in correct state for payment
    if (!['draft', 'quoted', 'assigned'].includes(booking.status)) {
      throw new Error(`Cannot create payment for booking in status: ${booking.status}`);
    }

    // Server-side amount validation - ensure amount matches booking total
    if (booking.total_mxn_cents && Math.abs(booking.total_mxn_cents - amount) > 1) {
      console.error('Payment amount mismatch', {
        booking_total: booking.total_mxn_cents,
        requested_amount: amount,
        booking_id
      });
      throw new Error('Payment amount does not match booking total');
    }

    // Verify quote if provided
    if (quote_validation) {
      const { data: storedQuote } = await supabaseClient
        .from('quotes')
        .select('payload')
        .eq('booking_id', booking_id)
        .single();

      if (storedQuote?.payload?.quote?.total && 
          Math.abs(storedQuote.payload.quote.total - amount) > 1) {
        throw new Error('Payment amount does not match validated quote');
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    console.log(`Creating payment intent for booking ${booking_id}, amount: ${amount}`);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'mxn',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        booking_id: booking_id,
        user_id: user.id,
      },
      description: `Payment for security booking - ${booking.pickup_address || 'Booking'}`,
    });

    // Record payment in database with retry logic
    let paymentRecorded = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!paymentRecorded && attempts < maxAttempts) {
      attempts++;
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          booking_id: booking_id,
          amount_preauth: amount,
          provider: 'stripe',
          status: 'pending',
          preauth_id: paymentIntent.id,
        });

      if (!paymentError) {
        paymentRecorded = true;
        console.log(`Payment recorded successfully on attempt ${attempts}`);
      } else {
        console.error(`Failed to record payment (attempt ${attempts}):`, paymentError);
        if (attempts === maxAttempts) {
          // Cancel the payment intent if we can't record it
          try {
            await stripe.paymentIntents.cancel(paymentIntent.id);
            console.log('Payment intent canceled due to database error');
          } catch (cancelError) {
            console.error('Failed to cancel payment intent:', cancelError);
          }
          throw new Error('Failed to record payment in database');
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
      }
    }

    console.log(`Payment intent created: ${paymentIntent.id}`);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create payment intent',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});