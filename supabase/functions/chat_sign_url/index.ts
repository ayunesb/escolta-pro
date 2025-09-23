import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization")! } },
  });
  const { path } = await req.json();
  const { data, error } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60);
  if (error) return new Response(error.message, { status: 400 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});
