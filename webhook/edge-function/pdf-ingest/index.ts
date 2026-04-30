import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  const payload = await req.json();

  const { bucket_id, name } = payload.record;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get signed URL
  const { data } = await supabase.storage
    .from(bucket_id)
    .createSignedUrl(name, 60);

  const fileUrl = data?.signedUrl;

  // Send to your Python ingestion service
  await fetch("https://talisman-donated-footpad.ngrok-free.dev/ingest/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl }),
  });

  return new Response("OK");
});
