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

    const {
      company_id,
      name,
      email,
      address,
      role,
      id_doc_url,
      driver_license_url,
      photo_formal_url,
    } = await req.json();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("company_staff_upsert: auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user belongs to the same company
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr) {
      console.error("company_staff_upsert: profile error", profErr);
      return new Response(JSON.stringify({ error: profErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile?.company_id || profile.company_id !== company_id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const guardId = crypto.randomUUID();

    // Create guard under this company (RLS allows using user client)
    const { error: gErr } = await supabase.from("guards").insert({
      id: guardId,
      company_id,
      status: "pending",
      active: true,
      photo_url: photo_formal_url || null,
      availability_status: "offline",
      skills: {},
      city: null,
    });

    if (gErr) {
      console.error("company_staff_upsert: insert guard error", gErr);
      return new Response(JSON.stringify({ error: gErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gdocs: any[] = [];
    if (id_doc_url) gdocs.push({ guard_id: guardId, doc_type: "id_document", url: id_doc_url });
    if (driver_license_url)
      gdocs.push({ guard_id: guardId, doc_type: "driver_license", url: driver_license_url });

    if (gdocs.length) {
      const { error: gdErr } = await supabase.from("guard_documents").insert(gdocs);
      if (gdErr) {
        console.warn("company_staff_upsert: insert guard_docs error (non-fatal)", gdErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, guard_id: guardId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("company_staff_upsert: unexpected error", e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
