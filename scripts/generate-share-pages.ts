// Post-build generator for social crawlers that do not execute React.
// Creates a real HTML file for every published story URL with story-specific OG tags.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SITE_URL = "https://afriwedd.com";
const API_URL = "https://uoxajklqakmjppejqlor.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveGFqa2xxYWttanBwZWpxbG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjczNjQsImV4cCI6MjA4NjkwMzM2NH0.rdPH61-HY7GWUeY4pot7ALOHP5TrbHwmvEaRlCO33Ms";

type Story = {
  slug: string;
  title: string;
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainText(value: string | null): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const FALLBACK_IMAGE = `${SITE_URL}/app-icon-512-v2.png`;

// Social crawlers (WhatsApp/Facebook) reject webp/avif and choke on very large files.
// Normalise every featured image to a crawler-safe, correctly sized URL.
function shareImage(raw: string | null): { url: string; type: string } {
  if (!raw) return { url: FALLBACK_IMAGE, type: "image/png" };
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//i.test(url)) return { url: FALLBACK_IMAGE, type: "image/png" };
  url = url.replace(/^http:\/\//i, "https://");

  const ext = (url.split("?")[0].split(".").pop() ?? "").toLowerCase();

  if (ext === "webp" || ext === "avif") {
    // Convert unsupported formats to JPEG through an image proxy.
    const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(
      url.replace(/^https?:\/\//i, ""),
    )}&w=1200&h=630&fit=cover&output=jpg&q=82`;
    return { url: proxied, type: "image/jpeg" };
  }

  if (url.includes("/storage/v1/object/public/")) {
    const rendered = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const sep = rendered.includes("?") ? "&" : "?";
    return {
      url: `${rendered}${sep}width=1200&height=630&resize=cover&format=origin`,
      type: ext === "png" ? "image/png" : "image/jpeg",
    };
  }

  return { url, type: ext === "png" ? "image/png" : "image/jpeg" };
}

function removeFallbackMetadata(html: string): string {
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/\s*<meta\s+(?:property|name)=["'](?:og|twitter):(?:title|description|type|url|image|card)["'][^>]*>/gi, "")
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, "");
}

async function fetchPublishedStories(): Promise<Story[]> {
  const select = "slug,title,excerpt,meta_title,meta_description,featured_image_url";
  const response = await fetch(
    `${API_URL}/rest/v1/blog_posts?select=${select}&status=eq.publish&slug=not.is.null`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        Range: "0-4999",
      },
    },
  );

  if (!response.ok) throw new Error(`Story metadata request failed: ${response.status}`);
  return (await response.json()) as Story[];
}

async function main() {
  const baseHtml = removeFallbackMetadata(readFileSync(resolve("dist/index.html"), "utf8"));
  const stories = await fetchPublishedStories();
  let generated = 0;

  for (const story of stories) {
    if (!story.slug) continue;

    const canonical = `${SITE_URL}/stories/${encodeURIComponent(story.slug)}`;
    const title = plainText(story.meta_title || story.title) || "Afriwedd Story";
    const description = (
      plainText(story.meta_description || story.excerpt) ||
      `Read ${plainText(story.title)} on Afriwedd.`
    ).slice(0, 160);
    const { url: image, type: imageType } = shareImage(story.featured_image_url);
    const metadata = `
    <title>${escapeHtml(title)} — Afriwedd</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:site_name" content="Afriwedd" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Featured image for ${escapeHtml(story.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />`;

    const output = resolve("dist", "stories", story.slug, "index.html");
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, baseHtml.replace("</head>", `${metadata}\n  </head>`));
    generated += 1;
  }

  console.log(`Generated ${generated} story share pages with featured images.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});