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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { type, table, record, old_record } = await req.json();
    console.log('Booking status trigger:', { type, table, record: record?.id, old_status: old_record?.status, new_status: record?.status });

    if (table !== 'bookings' || type !== 'UPDATE') {
      return new Response(JSON.stringify({ message: 'Not a booking update' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const booking = record;
    const oldBooking = old_record;

    // Check if status changed
    if (!booking || !oldBooking || booking.status === oldBooking.status) {
      return new Response(JSON.stringify({ message: 'Status unchanged' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Status changed from ${oldBooking.status} to ${booking.status} for booking ${booking.id}`);

    // Define notification messages for different status changes
    const statusMessages = {
      'assigned': {
        title: 'Guard Assigned!',
        message: 'A security guard has been assigned to your booking and will arrive shortly.',
        type: 'booking_update'
      },
      'in_progress': {
        title: 'Service Started',
        message: 'Your security service is now active and in progress.',
        type: 'booking_update'
      },
      'completed': {
        title: 'Service Completed',
        message: 'Your security service has been completed successfully. Thank you for choosing Blindado!',
        type: 'booking_update'
      },
      'cancelled': {
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled. If you have any questions, please contact support.',
        type: 'booking_update'
      }
    };

    const statusUpdate = statusMessages[booking.status as keyof typeof statusMessages];
    
    if (statusUpdate && booking.client_id) {
      // Send notification to client
      await supabase.rpc('send_notification', {
        p_user_id: booking.client_id,
        p_booking_id: booking.id,
        p_type: statusUpdate.type,
        p_title: statusUpdate.title,
        p_message: statusUpdate.message,
        p_action_url: `/booking/${booking.id}`,
        p_metadata: {
          old_status: oldBooking.status,
          new_status: booking.status,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Notification sent to client ${booking.client_id} about status change`);
    }

    // Send notification to assigned guard if exists
    if (booking.assigned_user_id && statusUpdate) {
      const guardMessages = {
        'assigned': {
          title: 'New Assignment',
          message: `You've been assigned to a new security job at ${booking.pickup_address}`,
          type: 'assignment_change'
        },
        'in_progress': {
          title: 'Job Started',
          message: 'Your security assignment is now active. Stay alert and professional.',
          type: 'assignment_change'
        },
        'completed': {
          title: 'Job Completed',
          message: 'Your security assignment has been completed. Great work!',
          type: 'assignment_change'
        },
        'cancelled': {
          title: 'Assignment Cancelled',
          message: 'Your security assignment has been cancelled.',
          type: 'assignment_change'
        }
      };

      const guardUpdate = guardMessages[booking.status as keyof typeof guardMessages];
      if (guardUpdate) {
        await supabase.rpc('send_notification', {
          p_user_id: booking.assigned_user_id,
          p_booking_id: booking.id,
          p_type: guardUpdate.type,
          p_title: guardUpdate.title,
          p_message: guardUpdate.message,
          p_action_url: `/booking/${booking.id}`,
          p_metadata: {
            old_status: oldBooking.status,
            new_status: booking.status,
            timestamp: new Date().toISOString()
          }
        });

        console.log(`Notification sent to guard ${booking.assigned_user_id} about status change`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed status change from ${oldBooking.status} to ${booking.status}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Booking status trigger error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});