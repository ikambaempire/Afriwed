// Mirrors WordPress images into the vendor-media storage bucket.
// Admin-only. Processes pending media assets in parallel batches with timeouts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, ms: number) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: { "User-Agent": "AfriweddBot/1.0" }, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const auth = req.headers.get("Authorization") || "";
  const userClient = createClient(supaUrl, anonKey, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const admin = createClient(supaUrl, serviceKey);

  let batchSize = 15;
  try { const body = await req.json(); if (body?.batch) batchSize = Math.min(40, Math.max(1, body.batch)); } catch {}

  const { data: pending, error } = await admin
    .from("blog_media_assets")
    .select("id, source_url")
    .eq("status", "pending")
    .limit(batchSize);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const results = { processed: 0, succeeded: 0, failed: 0, remaining: 0, errors: [] as string[] };
  const urlMap: Record<string, string> = {};

  // Parallel processing with bounded concurrency
  await Promise.all((pending ?? []).map(async (item) => {
    results.processed++;
    try {
      const res = await fetchWithTimeout(item.source_url, FETCH_TIMEOUT_MS);
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
      const msg = String(e?.message ?? e).slice(0, 200);
      await admin.from("blog_media_assets").update({ status: "error", error: msg }).eq("id", item.id);
      results.failed++;
      if (results.errors.length < 5) results.errors.push(msg);
    }
  }));

  // Targeted post rewrite: only fetch posts that actually contain any mirrored URL.
  const entries = Object.entries(urlMap);
  if (entries.length) {
    // Featured image: direct equality update (fast, indexed-friendly)
    await Promise.all(entries.map(([src, dest]) =>
      admin.from("blog_posts").update({ featured_image_url: dest }).eq("featured_image_url", src)
    ));

    // Content rewrite: query only posts containing any of these URLs
    const orFilter = entries.map(([src]) => `content_html.ilike.%${src.replace(/,/g, "")}%`).join(",");
    const { data: posts } = await admin
      .from("blog_posts")
      .select("id, content_html")
      .or(orFilter);

    await Promise.all((posts ?? []).map(async (p: any) => {
      let html = p.content_html || "";
      let changed = false;
      for (const [src, dest] of entries) {
        if (html.includes(src)) { html = html.split(src).join(dest); changed = true; }
      }
      if (changed) await admin.from("blog_posts").update({ content_html: html }).eq("id", p.id);
    }));
  }

  const { count } = await admin.from("blog_media_assets").select("*", { count: "exact", head: true }).eq("status", "pending");
  results.remaining = count ?? 0;

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
