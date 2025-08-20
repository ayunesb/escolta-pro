import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log(`real_time_sync: ${req.method} request received`);

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
      console.error("real_time_sync: auth error", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      sync_type,
      entity_type,
      entity_id,
      last_sync,
      include_related = false
    }: { 
      sync_type: 'full' | 'incremental';
      entity_type: 'bookings' | 'assignments' | 'messages' | 'all';
      entity_id?: string;
      last_sync?: string;
      include_related?: boolean;
    } = await req.json();

    console.log("real_time_sync: syncing", { sync_type, entity_type, entity_id, user_id: user.id });

    const syncData: Record<string, any> = {};
    const lastSyncTime = last_sync ? new Date(last_sync) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Helper function to apply timestamp filter for incremental sync
    const applyTimeFilter = (query: any) => {
      if (sync_type === 'incremental' && last_sync) {
        return query.gt('updated_at', lastSyncTime.toISOString());
      }
      return query;
    };

    // Sync bookings
    if (entity_type === 'bookings' || entity_type === 'all') {
      let bookingsQuery = supabase
        .from('bookings')
        .select('*')
        .or(`client_id.eq.${user.id},assigned_user_id.eq.${user.id}`);

      if (entity_id) {
        bookingsQuery = bookingsQuery.eq('id', entity_id);
      }

      bookingsQuery = applyTimeFilter(bookingsQuery);

      const { data: bookings, error: bookingsError } = await bookingsQuery
        .order('updated_at', { ascending: false })
        .limit(100);

      if (bookingsError) {
        console.error("real_time_sync: bookings error", bookingsError);
      } else {
        syncData.bookings = bookings || [];
        console.log(`real_time_sync: synced ${syncData.bookings.length} bookings`);
      }
    }

    // Sync assignments (for guards)
    if (entity_type === 'assignments' || entity_type === 'all') {
      let assignmentsQuery = applyTimeFilter(
        supabase
          .from('assignments')
          .select('*')
          .eq('guard_id', user.id)
      );

      if (entity_id) {
        assignmentsQuery = assignmentsQuery.eq('booking_id', entity_id);
      }

      const { data: assignments, error: assignmentsError } = await assignmentsQuery
        .order('updated_at', { ascending: false })
        .limit(100);

      if (assignmentsError) {
        console.error("real_time_sync: assignments error", assignmentsError);
      } else {
        syncData.assignments = assignments || [];
        console.log(`real_time_sync: synced ${syncData.assignments.length} assignments`);
      }
    }

    // Sync messages
    if (entity_type === 'messages' || entity_type === 'all') {
      // Get bookings user is involved in
      const { data: userBookings } = await supabase
        .from('bookings')
        .select('id')
        .or(`client_id.eq.${user.id},assigned_user_id.eq.${user.id}`);

      if (userBookings?.length) {
        const bookingIds = userBookings.map(b => b.id);
        
        let messagesQuery = applyTimeFilter(
          supabase
            .from('messages')
            .select('*')
            .in('booking_id', bookingIds)
        );

        if (entity_id) {
          messagesQuery = messagesQuery.eq('booking_id', entity_id);
        }

        const { data: messages, error: messagesError } = await messagesQuery
          .order('created_at', { ascending: false })
          .limit(200);

        if (messagesError) {
          console.error("real_time_sync: messages error", messagesError);
        } else {
          syncData.messages = messages || [];
          console.log(`real_time_sync: synced ${syncData.messages.length} messages`);
        }
      } else {
        syncData.messages = [];
      }
    }

    // Include related data if requested
    if (include_related && syncData.bookings?.length) {
      const bookingIds = syncData.bookings.map((b: any) => b.id);
      
      // Get booking items
      const { data: bookingItems } = await supabase
        .from('booking_items')
        .select('*')
        .in('booking_id', bookingIds);
      
      syncData.booking_items = bookingItems || [];

      // Get payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .in('booking_id', bookingIds);
      
      syncData.payments = payments || [];
    }

    // Calculate sync stats
    const totalRecords = Object.values(syncData).reduce((sum, records: any) => 
      sum + (Array.isArray(records) ? records.length : 0), 0
    );

    const response = {
      success: true,
      sync_type,
      sync_timestamp: new Date().toISOString(),
      user_id: user.id,
      total_records: totalRecords,
      data: syncData,
      metadata: {
        entity_type,
        entity_id,
        last_sync: last_sync || null,
        include_related
      }
    };

    console.log(`real_time_sync: completed sync for user ${user.id}, ${totalRecords} total records`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("real_time_sync: error", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Real-time sync error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});