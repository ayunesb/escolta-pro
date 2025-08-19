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

    const {
      company_name,
      contact_name,
      contact_email,
      tax_id,
      payout_account_id,
    } = await req.json();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("company_upsert: auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch caller profile to determine current company
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr) {
      console.error("company_upsert: profile error", profErr);
      return new Response(JSON.stringify({ error: profErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile?.company_id) {
      // Update existing company (RLS allows if user is admin of company via profile.company_id)
      const { error: updErr } = await supabase
        .from("companies")
        .update({
          name: company_name || null,
          contact_name: contact_name || null,
          contact_email: contact_email || null,
          tax_id: tax_id || null,
          stripe_account_id: payout_account_id || null,
        })
        .eq("id", profile.company_id);

      if (updErr) {
        console.error("company_upsert: update error", updErr);
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, company_id: profile.company_id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Create new company and link profile (requires admin client to bypass RLS)
      if (!admin) {
        console.error("company_upsert: missing service role key to create company");
        return new Response(
          JSON.stringify({ error: "Server not configured for company creation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: comp, error: insErr } = await admin
        .from("companies")
        .insert({
          name: company_name || null,
          contact_name: contact_name || null,
          contact_email: contact_email || null,
          tax_id: tax_id || null,
          stripe_account_id: payout_account_id || null,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (insErr) {
        console.error("company_upsert: insert company error", insErr);
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: linkErr } = await supabase
        .from("profiles")
        .update({ company_id: comp.id })
        .eq("id", user.id);

      if (linkErr) {
        console.error("company_upsert: link profile error", linkErr);
        return new Response(JSON.stringify({ error: linkErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, company_id: comp.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e: any) {
    console.error("company_upsert: unexpected error", e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
