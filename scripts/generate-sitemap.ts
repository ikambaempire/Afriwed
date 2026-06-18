// Pre-build sitemap generator. Writes public/sitemap.xml from Supabase data.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://haruwa1.lovable.app";
const SUPA_URL = "https://uoxajklqakmjppejqlor.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveGFqa2xxYWttanBwZWpxbG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjczNjQsImV4cCI6MjA4NjkwMzM2NH0.rdPH61-HY7GWUeY4pot7ALOHP5TrbHwmvEaRlCO33Ms";

type Entry = { path: string; lastmod?: string; changefreq?: string; priority?: string };

async function fetchAll(table: string, select: string, filter = ""): Promise<any[]> {
  const out: any[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const url = `${SUPA_URL}/rest/v1/${table}?select=${select}${filter}`;
    const res = await fetch(url, {
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
        Range: `${from}-${from + pageSize - 1}`,
        Prefer: "count=exact",
      },
    });
    if (!res.ok) break;
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

(async () => {
  const entries: Entry[] = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/stories", changefreq: "daily", priority: "0.9" },
    { path: "/real-weddings", changefreq: "weekly", priority: "0.8" },
    { path: "/vendors", changefreq: "weekly", priority: "0.7" },
    { path: "/planning", changefreq: "monthly", priority: "0.5" },
    { path: "/submit", changefreq: "monthly", priority: "0.4" },
    { path: "/author-apply", changefreq: "monthly", priority: "0.4" },
    { path: "/auth", changefreq: "yearly", priority: "0.3" },
    { path: "/install", changefreq: "yearly", priority: "0.3" },
  ];

  try {
    const posts = await fetchAll("blog_posts", "slug,updated_at,published_at", "&status=eq.publish");
    for (const p of posts) {
      entries.push({
        path: `/stories/${p.slug}`,
        lastmod: (p.updated_at || p.published_at || "").slice(0, 10) || undefined,
        changefreq: "monthly",
        priority: "0.7",
      });
    }
    const weddings = await fetchAll("real_weddings", "slug,updated_at", "&status=eq.approved");
    for (const w of weddings) {
      entries.push({
        path: `/real-weddings/${w.slug}`,
        lastmod: (w.updated_at || "").slice(0, 10) || undefined,
        changefreq: "monthly",
        priority: "0.6",
      });
    }
    const authors = await fetchAll("blog_authors", "slug,updated_at", "&slug=not.is.null");
    for (const a of authors) {
      if (!a.slug) continue;
      entries.push({
        path: `/authors/${a.slug}`,
        lastmod: (a.updated_at || "").slice(0, 10) || undefined,
        changefreq: "weekly",
        priority: "0.5",
      });
    }
  } catch (e) {
    console.warn("sitemap: dynamic fetch failed, falling back to static entries", e);
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map(e =>
      [
        `  <url>`,
        `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        `  </url>`,
      ].filter(Boolean).join("\n")
    ),
    `</urlset>`,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
