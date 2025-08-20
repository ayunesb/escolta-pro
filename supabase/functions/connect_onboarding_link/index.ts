import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONNECT-ONBOARDING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use service role for secure database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Use anon key for user authentication
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { scope, company_id } = await req.json();
    if (!scope || !['freelancer', 'company'].includes(scope)) {
      throw new Error("Invalid scope. Must be 'freelancer' or 'company'");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    let accountId: string;
    
    if (scope === 'freelancer') {
      // Handle freelancer (guard) Connect account
      const { data: profile } = await supabaseService
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (profile?.stripe_account_id) {
        accountId = profile.stripe_account_id;
        logStep("Using existing freelancer account", { accountId });
      } else {
        // Create new Connect account
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'MX',
          email: user.email,
          capabilities: {
            transfers: { requested: true },
          },
        });
        accountId = account.id;
        
        // Save to database
        await supabaseService
          .from('profiles')
          .update({ stripe_account_id: accountId })
          .eq('id', user.id);
        
        logStep("Created new freelancer account", { accountId });
      }
    } else {
      // Handle company Connect account
      if (!company_id) throw new Error("company_id required for company scope");
      
      const { data: company } = await supabaseService
        .from('companies')
        .select('stripe_account_id')
        .eq('id', company_id)
        .single();

      if (company?.stripe_account_id) {
        accountId = company.stripe_account_id;
        logStep("Using existing company account", { accountId, company_id });
      } else {
        // Create new Connect account
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'MX',
          email: user.email,
          capabilities: {
            transfers: { requested: true },
          },
        });
        accountId = account.id;
        
        // Save to database
        await supabaseService
          .from('companies')
          .update({ stripe_account_id: accountId })
          .eq('id', company_id);
        
        logStep("Created new company account", { accountId, company_id });
      }
    }

    // Create onboarding link
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/billing`,
      return_url: `${origin}/billing`,
      type: 'account_onboarding',
    });

    logStep("Created onboarding link", { url: accountLink.url });

    return new Response(JSON.stringify({ url: accountLink.url }), {
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