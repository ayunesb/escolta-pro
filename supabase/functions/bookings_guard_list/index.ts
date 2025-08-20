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

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") ?? "available"; // "available"|"mine"

    // current user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("bookings_guard_list: auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("bookings_guard_list: fetching bookings for user", user.id, "scope", scope);

    if (scope === "mine") {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("assigned_user_id", user.id)
        .in("status", ["assigned", "enroute", "onsite", "in_progress", "completed", "canceled", "failed"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("bookings_guard_list: error fetching mine", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("bookings_guard_list: found", data?.length, "assigned bookings");
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // available: status=matching
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "matching")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("bookings_guard_list: error fetching available", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("bookings_guard_list: found", data?.length, "available bookings");
    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("bookings_guard_list: unexpected error", e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});