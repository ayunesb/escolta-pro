import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYOUTS-LIST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user is a freelancer/guard
    const { data: guard } = await supabase
      .from('guards')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let query = supabase
      .from('payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (guard?.id) {
      // User is a guard - show their payouts
      query = query.eq('guard_id', guard.id);
      logStep("Filtering payouts for guard", { guard_id: guard.id });
    } else {
      // Check if user is a company admin
      const { company_id } = await req.json().catch(() => ({}));
      
      if (company_id) {
        // Filter by company if provided
        query = query.eq('company_id', company_id);
        logStep("Filtering payouts for company", { company_id });
      } else {
        // No guard profile and no company_id - return empty
        logStep("User has no guard profile and no company_id provided");
        return new Response(JSON.stringify({ payouts: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    const { data: payouts, error } = await query;
    
    if (error) {
      logStep("Database error", { error: error.message });
      throw error;
    }

    logStep("Retrieved payouts", { count: payouts?.length || 0 });

    return new Response(JSON.stringify({ payouts: payouts || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});