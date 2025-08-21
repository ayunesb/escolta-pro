import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid user token');
    }

    const { account_type, company_id } = await req.json();

    let accountId: string | null = null;
    let email = userData.user.email;

    if (account_type === 'company' && company_id) {
      // Company Connect account
      const { data: company, error: companyError } = await supabaseClient
        .from('companies')
        .select('stripe_account_id, contact_email')
        .eq('id', company_id)
        .single();

      if (companyError) {
        throw new Error('Company not found');
      }

      accountId = company.stripe_account_id;
      email = company.contact_email || email;

      if (!accountId) {
        // Create new Stripe Connect account for company
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'MX',
          email: email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        accountId = account.id;

        // Save account ID to company
        await supabaseClient
          .from('companies')
          .update({ stripe_account_id: accountId })
          .eq('id', company_id);
      }
    } else {
      // Individual freelancer Connect account
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', userData.user.id)
        .single();

      if (profileError) {
        throw new Error('Profile not found');
      }

      accountId = profile.stripe_account_id;

      if (!accountId) {
        // Create new Stripe Connect account for freelancer
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'MX',
          email: email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        accountId = account.id;

        // Save account ID to profile
        await supabaseClient
          .from('profiles')
          .update({ stripe_account_id: accountId })
          .eq('id', userData.user.id);
      }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get('origin')}/billing?refresh=true`,
      return_url: `${req.headers.get('origin')}/billing?success=true`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        account_id: accountId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});