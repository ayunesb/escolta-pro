// Supabase Edge Function: validate_quote
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const { hours, base_rate_mxn } = body;
    const min_hours = 4;
    const fee_pct = 0.10;
    const valid_hours = Math.max(hours, min_hours);
    const subtotal = valid_hours * base_rate_mxn;
    const fee = Math.ceil(subtotal * fee_pct);
    const total = subtotal + fee;
    return new Response(
      JSON.stringify({
        ok: true,
        min_hours,
        fee_pct,
        subtotal,
        fee,
        total,
        currency: 'MXN'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200
      }
    );
    } catch (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400
        }
      );
    }
});
