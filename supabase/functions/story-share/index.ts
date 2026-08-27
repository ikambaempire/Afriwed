// Serves crawler-friendly HTML with per-story Open Graph tags.
// Humans are redirected straight to the real story page.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SITE_URL = "https://afriwedd.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainText(value: string | null | undefined): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function firstArticleImage(html: string | null | undefined): string | null {
  if (!html) return null;
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

function shareImage(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//i.test(url)) return null;
  url = url.replace(/^http:\/\//i, "https://");
  return `https://images.weserv.nl/?url=${encodeURIComponent(
    url.replace(/^https?:\/\//i, ""),
  )}&w=1200&h=630&fit=cover&a=attention&output=jpg&q=82`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? url.pathname.split("/").filter(Boolean).pop() ?? "";
  const target = `${SITE_URL}/stories/${encodeURIComponent(slug)}`;

  if (!slug || slug === "story-share") {
    return Response.redirect(`${SITE_URL}/stories`, 302);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { data: story } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt,meta_title,meta_description,featured_image_url,og_image_url,content_html,published_at,updated_at")
    .eq("slug", slug)
    .eq("status", "publish")
    .maybeSingle();

  if (!story) return Response.redirect(target, 302);

  const title = plainText(story.meta_title || story.title) || "Afriwedd Story";
  const description = (
    plainText(story.meta_description || story.excerpt) || `Read ${plainText(story.title)} on Afriwedd.`
  ).slice(0, 160);
  const image = shareImage(
    story.featured_image_url || story.og_image_url || firstArticleImage(story.content_html),
  );

  const imageTags = image
    ? `
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(plainText(story.title))}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} — Afriwedd</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(target)}" />
    <meta property="og:site_name" content="Afriwedd" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(target)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />${imageTags}
    <meta http-equiv="refresh" content="0; url=${escapeHtml(target)}" />
  </head>
  <body>
    <p>Redirecting to <a href="${escapeHtml(target)}">${escapeHtml(title)}</a>…</p>
    <script>window.location.replace(${JSON.stringify(target)});</script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
