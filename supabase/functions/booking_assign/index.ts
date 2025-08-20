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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("booking_assign: auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { booking_id, staff_user_id, company_id } = await req.json();

    console.log("booking_assign: user", user.id, "assigning booking", booking_id, "to staff", staff_user_id, "for company", company_id);

    // verify requester belongs to company_id
    const { data: mem } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .eq("company_id", company_id)
      .single();

    if (!mem) {
      console.error("booking_assign: user not authorized for company", company_id);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // set assignment
    const { data, error } = await supabase
      .from("bookings")
      .update({ 
        status: "assigned", 
        assigned_user_id: staff_user_id, 
        assigned_company_id: company_id 
      })
      .eq("id", booking_id)
      .select()
      .single();

    if (error) {
      console.error("booking_assign: error updating booking", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("booking_assign: successfully assigned booking", booking_id, "to staff", staff_user_id);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("booking_assign: unexpected error", e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});