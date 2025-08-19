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
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      : null;

    const { name, email, address } = await req.json();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("freelancer_apply: auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [first_name, ...rest] = (name || "").trim().split(" ");
    const last_name = rest.join(" ").trim() || null;

    // Update profile basics
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ email: email || null, first_name: first_name || null, last_name })
      .eq("id", user.id);

    if (pErr) {
      console.error("freelancer_apply: update profile error", pErr);
      return new Response(JSON.stringify({ error: pErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!admin) {
      console.error("freelancer_apply: missing service role key to create guard");
      return new Response(
        JSON.stringify({ error: "Server not configured for guard creation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const guardId = crypto.randomUUID();

    // Create a guard profile for the user (no company)
    const { error: gErr } = await admin.from("guards").insert({
      id: guardId,
      user_id: user.id,
      company_id: null,
      status: "applicant",
      active: true,
      availability_status: "offline",
      skills: {},
      city: null,
    });

    if (gErr) {
      console.error("freelancer_apply: insert guard error", gErr);
      return new Response(JSON.stringify({ error: gErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, guard_id: guardId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("freelancer_apply: unexpected error", e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
