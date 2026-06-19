// Mirrors WordPress images into the vendor-media storage bucket.
// Admin-only. Runs the heavy work in the background via EdgeRuntime.waitUntil
// so the HTTP request returns quickly and large batches don't time out.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FETCH_TIMEOUT_MS = 15_000;
const CONCURRENCY = 6;

async function fetchWithTimeout(url: string, ms: number) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: { "User-Agent": "AfriweddBot/1.0", "Accept": "image/*,*/*" }, signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(id);
  }
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>) {
  const out: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function processBatch(admin: any, batchSize: number) {
  const { data: pending, error } = await admin
    .from("blog_media_assets")
    .select("id, source_url")
    .eq("status", "pending")
    .limit(batchSize);
  if (error) { console.error("fetch pending failed:", error); return { succeeded: 0, failed: 0 }; }

  // Mark as processing to avoid double-work on concurrent invocations
  const ids = (pending ?? []).map((p: any) => p.id);
  if (ids.length) await admin.from("blog_media_assets").update({ status: "processing" }).in("id", ids);

  const urlMap: Record<string, string> = {};
  let succeeded = 0, failed = 0;

  await pool(pending ?? [], CONCURRENCY, async (item: any) => {
    try {
      const res = await fetchWithTimeout(item.source_url, FETCH_TIMEOUT_MS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength === 0) throw new Error("empty body");
      const ct = res.headers.get("content-type") || "image/jpeg";
      const extGuess = (item.source_url.split("?")[0].split(".").pop() || "jpg").toLowerCase().slice(0, 5);
      const ext = /^(jpg|jpeg|png|webp|gif|avif)$/.test(extGuess) ? extGuess : "jpg";
      const path = `wp-import/${item.id}.${ext}`;
      const up = await admin.storage.from("vendor-media").upload(path, buf, { contentType: ct, upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = admin.storage.from("vendor-media").getPublicUrl(path);
      await admin.from("blog_media_assets").update({ status: "done", hosted_url: pub.publicUrl, error: null }).eq("id", item.id);
      urlMap[item.source_url] = pub.publicUrl;
      succeeded++;
    } catch (e: any) {
      const msg = String(e?.message ?? e).slice(0, 200);
      await admin.from("blog_media_assets").update({ status: "error", error: msg }).eq("id", item.id);
      failed++;
      console.warn("mirror failed", item.source_url, msg);
    }
  });

  // Rewrite references
  const entries = Object.entries(urlMap);
  if (entries.length) {
    // Fast featured_image_url updates
    await pool(entries, 4, async ([src, dest]) => {
      await admin.from("blog_posts").update({ featured_image_url: dest }).eq("featured_image_url", src);
    });

    // Content rewrite: scan posts that still reference any wp-content upload, in pages
    let from = 0;
    const PAGE = 200;
    while (true) {
      const { data: posts } = await admin
        .from("blog_posts")
        .select("id, content_html")
        .ilike("content_html", "%/wp-content/uploads/%")
        .range(from, from + PAGE - 1);
      if (!posts || posts.length === 0) break;
      await Promise.all(posts.map(async (p: any) => {
        let html = p.content_html || "";
        let changed = false;
        for (const [src, dest] of entries) {
          if (html.includes(src)) { html = html.split(src).join(dest); changed = true; }
        }
        if (changed) await admin.from("blog_posts").update({ content_html: html }).eq("id", p.id);
      }));
      if (posts.length < PAGE) break;
      from += PAGE;
    }
  }

  return { succeeded, failed };
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

  let totalBatch = 100;
  let perChunk = 25;
  let background = true;
  try {
    const body = await req.json();
    if (typeof body?.batch === "number") totalBatch = Math.min(500, Math.max(1, body.batch));
    if (typeof body?.chunk === "number") perChunk = Math.min(40, Math.max(1, body.chunk));
    if (body?.background === false) background = false;
  } catch {}

  // Re-queue rows stuck in "processing" for >5 min (defensive)
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  await admin.from("blog_media_assets").update({ status: "pending" }).eq("status", "processing").lt("updated_at", fiveMinAgo);

  const work = async () => {
    let done = 0;
    while (done < totalBatch) {
      const chunk = Math.min(perChunk, totalBatch - done);
      const { succeeded, failed } = await processBatch(admin, chunk);
      done += succeeded + failed;
      if (succeeded + failed === 0) break;
    }
  };

  const { count: pendingBefore } = await admin.from("blog_media_assets").select("*", { count: "exact", head: true }).eq("status", "pending");

  if (background && (globalThis as any).EdgeRuntime?.waitUntil) {
    (globalThis as any).EdgeRuntime.waitUntil(work());
    return new Response(JSON.stringify({ status: "started", queued: totalBatch, pendingBefore: pendingBefore ?? 0 }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  await work();
  const { count: remaining } = await admin.from("blog_media_assets").select("*", { count: "exact", head: true }).eq("status", "pending");
  return new Response(JSON.stringify({ status: "complete", remaining: remaining ?? 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
