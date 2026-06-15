// Mirrors WordPress images into the vendor-media storage bucket.
// Admin-only. Processes pending media assets in batches.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify admin
  const auth = req.headers.get("Authorization") || "";
  const userClient = createClient(supaUrl, anonKey, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const admin = createClient(supaUrl, serviceKey);

  let batchSize = 30;
  try { const body = await req.json(); if (body?.batch) batchSize = Math.min(100, Math.max(1, body.batch)); } catch {}

  const { data: pending, error } = await admin
    .from("blog_media_assets")
    .select("id, source_url")
    .eq("status", "pending")
    .limit(batchSize);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const results = { processed: 0, succeeded: 0, failed: 0, remaining: 0 };
  const urlMap: Record<string, string> = {};

  for (const item of pending ?? []) {
    results.processed++;
    try {
      const res = await fetch(item.source_url, { headers: { "User-Agent": "AfriweddBot/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const ct = res.headers.get("content-type") || "image/jpeg";
      const ext = (item.source_url.split(".").pop() || "jpg").split("?")[0].slice(0, 5);
      const path = `wp-import/${item.id}.${ext}`;
      const up = await admin.storage.from("vendor-media").upload(path, buf, { contentType: ct, upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = admin.storage.from("vendor-media").getPublicUrl(path);
      await admin.from("blog_media_assets").update({ status: "done", hosted_url: pub.publicUrl, error: null }).eq("id", item.id);
      urlMap[item.source_url] = pub.publicUrl;
      results.succeeded++;
    } catch (e: any) {
      await admin.from("blog_media_assets").update({ status: "error", error: String(e?.message ?? e) }).eq("id", item.id);
      results.failed++;
    }
  }

  // Rewrite post content + featured image for the URLs we mirrored
  if (Object.keys(urlMap).length) {
    const sources = Object.keys(urlMap);
    const { data: posts } = await admin
      .from("blog_posts")
      .select("id, content_html, featured_image_url")
      .or(sources.map(s => `content_html.ilike.%${s.split("/").pop()?.split("?")[0]}%`).slice(0,5).join(","));
    // Simpler: just rewrite all posts that contain any of the URLs (fetch all once)
    const { data: allPosts } = await admin.from("blog_posts").select("id, content_html, featured_image_url");
    for (const p of allPosts ?? []) {
      let html = p.content_html || "";
      let fi = p.featured_image_url || "";
      let changed = false;
      for (const [src, dest] of Object.entries(urlMap)) {
        if (html.includes(src)) { html = html.split(src).join(dest); changed = true; }
        if (fi === src) { fi = dest; changed = true; }
      }
      if (changed) await admin.from("blog_posts").update({ content_html: html, featured_image_url: fi }).eq("id", p.id);
    }
  }

  const { count } = await admin.from("blog_media_assets").select("*", { count: "exact", head: true }).eq("status", "pending");
  results.remaining = count ?? 0;

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
