import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { bucket, path, expiresIn = 3600 } = await req.json();
    // only allow paths that start with requester uid; caller must pass a JWT
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: user } = await supabase.auth.getUser(auth || "");
    if (!user?.user) return new Response("Unauthorized", { status: 401 });
    if (!path.startsWith(`${user.user.id}/`)) return new Response("Forbidden", { status: 403 });

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return new Response(JSON.stringify({ url: data.signedUrl }), { headers: { "content-type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
