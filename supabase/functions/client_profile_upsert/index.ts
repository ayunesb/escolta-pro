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
    const supabaseAdmin = SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      : null;

    const { first_name, last_name, email, phone, id_doc_url, proof_of_residence_url } = await req.json();

    // Get authenticated user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("client_profile_upsert: auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile (RLS: user can update own profile)
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ 
        email: email || null, 
        first_name: first_name || null, 
        last_name: last_name || null,
        phone_e164: phone || null
      })
      .eq("id", user.id);

    if (upErr) {
      console.error("client_profile_upsert: update profile error", upErr);
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const docs: Array<any> = [];
    if (id_doc_url) {
      docs.push({
        file_path: id_doc_url,
        doc_type: "id_document",
        owner_type: "profile",
        owner_id: user.id,
      });
    }
    if (proof_of_residence_url) {
      docs.push({
        file_path: proof_of_residence_url,
        doc_type: "proof_of_residence",
        owner_type: "profile",
        owner_id: user.id,
      });
    }

    if (docs.length) {
      const { error: docErr } = await supabase.from("documents").insert(docs);
      if (docErr) {
        console.warn("client_profile_upsert: insert docs error (non-fatal)", docErr);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("client_profile_upsert: unexpected error", e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
