#!/usr/bin/env bun
// One-off: import any afriwedd.com posts not yet in blog_posts via psql.
import { spawnSync } from "child_process";

const WP = "https://afriwedd.com/wp-json/wp/v2";

function sqlEscape(s: string | null | undefined): string {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function psql(sql: string): string {
  const r = spawnSync("psql", ["-X", "-A", "-t", "-c", sql], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
}
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "post";

const existingIds = new Set(
  psql("SELECT wp_post_id FROM blog_posts WHERE wp_post_id IS NOT NULL")
    .split("\n").filter(Boolean).map(s => parseInt(s.trim(), 10))
);
console.log(`Have ${existingIds.size} posts.`);

const authorCache = new Map<number, string>();
async function ensureAuthor(wpA: any): Promise<string | null> {
  if (!wpA?.id) return null;
  if (authorCache.has(wpA.id)) return authorCache.get(wpA.id)!;
  const slug = wpA.slug || slugify(wpA.name || `author-${wpA.id}`);
  let id = psql(`SELECT id FROM blog_authors WHERE slug = ${sqlEscape(slug)} LIMIT 1`);
  if (!id) {
    id = psql(
      `INSERT INTO blog_authors (slug, display_name, bio, avatar_url) VALUES (${sqlEscape(slug)}, ${sqlEscape(wpA.name || slug)}, ${sqlEscape(wpA.description || null)}, ${sqlEscape(wpA.avatar_urls?.["96"] || null)}) RETURNING id`
    );
  }
  authorCache.set(wpA.id, id);
  return id;
}

let inserted = 0, skipped = 0, fetched = 0;
const newImages = new Set<string>();

for (let page = 1; page <= 30; page++) {
  const url = `${WP}/posts?per_page=30&page=${page}&_embed=author,wp:featuredmedia&orderby=date&order=desc`;
  const res = await fetch(url, { headers: { "User-Agent": "AfriweddImport/1.0" } });
  if (!res.ok) { console.warn("page", page, res.status); break; }
  const posts: any[] = await res.json();
  if (!posts.length) break;
  fetched += posts.length;

  let pageInserted = 0;
  for (const p of posts) {
    if (existingIds.has(p.id)) { skipped++; continue; }
    const authorId = await ensureAuthor(p._embedded?.author?.[0]);
    const fm = p._embedded?.["wp:featuredmedia"]?.[0];
    const featured = fm?.source_url || null;
    if (featured) newImages.add(featured);

    let slug = p.slug || slugify(p.title?.rendered || `post-${p.id}`);
    const dup = psql(`SELECT 1 FROM blog_posts WHERE slug = ${sqlEscape(slug)} LIMIT 1`);
    if (dup) slug = `${slug}-${p.id}`;

    const html = p.content?.rendered || "";
    for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) newImages.add((m as any)[1]);

    const title = (p.title?.rendered || "").replace(/<[^>]+>/g, "");
    const excerpt = (p.excerpt?.rendered || "").replace(/<[^>]+>/g, "").trim();
    const publishedAt = p.date_gmt ? new Date(p.date_gmt + "Z").toISOString() : new Date().toISOString();

    psql(
      `INSERT INTO blog_posts (wp_post_id, slug, title, excerpt, content_html, featured_image_url, status, published_at, author_id) VALUES (${p.id}, ${sqlEscape(slug)}, ${sqlEscape(title)}, ${sqlEscape(excerpt)}, ${sqlEscape(html)}, ${sqlEscape(featured)}, 'publish', ${sqlEscape(publishedAt)}, ${authorId ? sqlEscape(authorId) : "NULL"})`
    );
    existingIds.add(p.id);
    inserted++; pageInserted++;
  }
  console.log(`page ${page}: +${pageInserted} (total fetched ${fetched})`);
  if (pageInserted === 0 && skipped > 5) {
    // Reached already-imported zone — keep going a couple more pages then stop
    if (page > 3) break;
  }
}

// Queue images for mirroring (best-effort)
for (const u of newImages) {
  try { psql(`INSERT INTO blog_media_assets (source_url, status) VALUES (${sqlEscape(u)}, 'pending')`); } catch {}
}

console.log({ inserted, skipped, fetched, queuedImages: newImages.size });
