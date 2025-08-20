import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmergencyAlertRequest {
  booking_id: string;
  assignment_id?: string;
  emergency_type: string;
  severity: string;
  location?: {
    lat: number;
    lng: number;
  };
  description: string;
  media_urls?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      booking_id,
      assignment_id,
      emergency_type,
      severity,
      location,
      description,
      media_urls
    }: EmergencyAlertRequest = await req.json();

    console.log('Emergency alert received:', {
      booking_id,
      emergency_type,
      severity,
      location
    });

    // Get booking and assignment details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        client:profiles!client_id(first_name, last_name, email, phone_e164)
      `)
      .eq('id', booking_id)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    let guard = null;
    if (assignment_id) {
      const { data: assignment } = await supabase
        .from('assignments')
        .select(`
          *,
          guard:guards!guard_id(
            user_id,
            user:profiles!user_id(first_name, last_name, email, phone_e164)
          )
        `)
        .eq('id', assignment_id)
        .single();

      guard = assignment?.guard;
    }

    // Create emergency notifications for relevant parties
    const notifications = [];

    // Notify client if emergency is from guard
    if (guard) {
      notifications.push({
        recipient_id: booking.client_id,
        type: 'emergency_alert',
        title: 'Emergency Alert from Your Guard',
        message: `Your security guard has reported a ${emergency_type} emergency. ${description}`,
        urgent: severity === 'critical',
        data: {
          booking_id,
          assignment_id,
          emergency_type,
          severity,
          location
        }
      });
    }

    // Notify guard if emergency is from client
    if (guard && booking.client_id) {
      notifications.push({
        recipient_id: guard.user_id,
        type: 'emergency_alert',
        title: 'Emergency Alert from Client',
        message: `Your client has reported a ${emergency_type} emergency. ${description}`,
        urgent: severity === 'critical',
        data: {
          booking_id,
          assignment_id,
          emergency_type,
          severity,
          location
        }
      });
    }

    // For critical emergencies, also notify company admins
    if (severity === 'critical') {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'company_admin');

      if (admins) {
        for (const admin of admins) {
          notifications.push({
            recipient_id: admin.user_id,
            type: 'emergency_alert',
            title: 'CRITICAL Emergency Alert',
            message: `Critical emergency reported: ${emergency_type}. Immediate attention required.`,
            urgent: true,
            data: {
              booking_id,
              assignment_id,
              emergency_type,
              severity,
              location,
              client_name: booking.client?.first_name,
              guard_name: guard?.user?.first_name
            }
          });
        }
      }
    }

    // Send notifications (this would integrate with push notification service)
    console.log('Emergency notifications prepared:', notifications.length);

    // Log the emergency alert
    await supabase
      .from('audit_logs')
      .insert({
        action: 'emergency_alert',
        entity: 'booking',
        entity_id: booking_id,
        diff: {
          emergency_type,
          severity,
          location,
          description,
          media_urls,
          notifications_sent: notifications.length
        }
      });

    // Update booking status if critical
    if (severity === 'critical') {
      await supabase
        .from('bookings')
        .update({ 
          status: 'emergency',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id);
    }

    // In a real implementation, this would also:
    // - Send SMS/email alerts
    // - Contact emergency services if required
    // - Trigger automated response protocols
    // - Update dispatcher systems

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Emergency alert processed',
        notifications_sent: notifications.length,
        booking_id,
        severity
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error processing emergency alert:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to process emergency alert',
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});