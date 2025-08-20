import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import Stripe from 'https://esm.sh/stripe@14.9.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log(`Payment succeeded: ${paymentIntent.id}`);

        // Update payment record with retry logic
        let paymentUpdated = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!paymentUpdated && attempts < maxAttempts) {
          attempts++;
          const { error: updateError } = await supabaseClient
            .from('payments')
            .update({
              status: 'succeeded',
              amount_captured: paymentIntent.amount,
              charge_id: paymentIntent.latest_charge as string,
            })
            .eq('preauth_id', paymentIntent.id);

          if (!updateError) {
            paymentUpdated = true;
            console.log(`Payment updated successfully on attempt ${attempts}`);
          } else {
            console.error(`Failed to update payment (attempt ${attempts}):`, updateError);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
            }
          }
        }

        // Update booking status to confirmed
        if (paymentIntent.metadata.booking_id && paymentUpdated) {
          let bookingUpdated = false;
          attempts = 0;

          while (!bookingUpdated && attempts < maxAttempts) {
            attempts++;
            const { error: bookingError } = await supabaseClient
              .from('bookings')
              .update({ 
                status: 'confirmed',
                total_mxn_cents: paymentIntent.amount 
              })
              .eq('id', paymentIntent.metadata.booking_id);

            if (!bookingError) {
              bookingUpdated = true;
              console.log(`Booking updated successfully on attempt ${attempts}`);
            } else {
              console.error(`Failed to update booking (attempt ${attempts}):`, bookingError);
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
              }
            }
          }

          if (!bookingUpdated) {
            console.error('CRITICAL: Payment succeeded but failed to update booking status');
            // This should trigger an alert in production
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log(`Payment failed: ${paymentIntent.id}`);

        // Update payment record
        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({ status: 'failed' })
          .eq('preauth_id', paymentIntent.id);

        if (updateError) {
          console.error('Failed to update payment:', updateError);
        }

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log(`Payment canceled: ${paymentIntent.id}`);

        // Update payment record
        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({ status: 'canceled' })
          .eq('preauth_id', paymentIntent.id);

        if (updateError) {
          console.error('Failed to update payment:', updateError);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook handler failed', { status: 400 });
  }
});