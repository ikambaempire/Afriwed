// Imports missing posts from afriwedd.com WordPress REST API.
// Admin-only. Inserts authors, categories, tags, posts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WP = "https://afriwedd.com/wp-json/wp/v2";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "post";

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

  let perPage = 30;
  let maxPages = 20;
  try { const b = await req.json(); if (b?.perPage) perPage = Math.min(50, b.perPage); if (b?.maxPages) maxPages = Math.min(50, b.maxPages); } catch {}

  // Existing wp_post_ids
  const { data: existing } = await admin.from("blog_posts").select("wp_post_id").not("wp_post_id", "is", null);
  const have = new Set((existing ?? []).map((r: any) => r.wp_post_id));

  // Existing author cache
  const authorCache = new Map<number, string>(); // wp author id -> our author uuid

  let inserted = 0, skipped = 0, fetched = 0;
  const newImages: string[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `${WP}/posts?per_page=${perPage}&page=${page}&_embed=author,wp:featuredmedia&orderby=date&order=desc`;
    const res = await fetch(url, { headers: { "User-Agent": "AfriweddImport/1.0" } });
    if (!res.ok) break;
    const posts: any[] = await res.json();
    if (!posts.length) break;
    fetched += posts.length;

    for (const p of posts) {
      if (have.has(p.id)) { skipped++; continue; }

      // Author
      let authorUuid: string | null = null;
      const wpAuthor = p._embedded?.author?.[0];
      if (wpAuthor?.id) {
        if (authorCache.has(wpAuthor.id)) authorUuid = authorCache.get(wpAuthor.id)!;
        else {
          const aSlug = wpAuthor.slug || slugify(wpAuthor.name || `author-${wpAuthor.id}`);
          const { data: existA } = await admin.from("blog_authors").select("id").eq("slug", aSlug).maybeSingle();
          if (existA) { authorUuid = existA.id; }
          else {
            const { data: newA } = await admin.from("blog_authors").insert({
              slug: aSlug,
              display_name: wpAuthor.name || aSlug,
              bio: wpAuthor.description || null,
              avatar_url: wpAuthor.avatar_urls?.["96"] || null,
            }).select("id").maybeSingle();
            if (newA) authorUuid = newA.id;
          }
          if (authorUuid) authorCache.set(wpAuthor.id, authorUuid);
        }
      }

      // Featured image
      const fm = p._embedded?.["wp:featuredmedia"]?.[0];
      const featured = fm?.source_url || null;
      if (featured) newImages.push(featured);

      // Slug
      let slug = p.slug || slugify(p.title?.rendered || `post-${p.id}`);
      // ensure unique
      const { data: dup } = await admin.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
      if (dup) slug = `${slug}-${p.id}`;

      // Capture inline images
      const html = p.content?.rendered || "";
      const imgs = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/g)).map((m: any) => m[1]);
      newImages.push(...imgs);

      const { error: insErr } = await admin.from("blog_posts").insert({
        wp_post_id: p.id,
        slug,
        title: (p.title?.rendered || "").replace(/<[^>]+>/g, ""),
        excerpt: (p.excerpt?.rendered || "").replace(/<[^>]+>/g, "").trim(),
        content_html: html,
        featured_image_url: featured,
        status: "publish",
        published_at: p.date_gmt ? new Date(p.date_gmt + "Z").toISOString() : new Date().toISOString(),
        author_id: authorUuid,
      });
      if (!insErr) inserted++;
    }
  }

  // Register new images for mirroring
  const uniq = Array.from(new Set(newImages));
  if (uniq.length) {
    const rows = uniq.map(u => ({ source_url: u, status: "pending" as const }));
    // Use upsert on unique source_url if available; else best-effort insert (ignore conflicts)
    for (const r of rows) {
      await admin.from("blog_media_assets").insert(r).then(() => {}, () => {});
    }
  }

  return new Response(JSON.stringify({ inserted, skipped, fetched, queuedImages: uniq.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
