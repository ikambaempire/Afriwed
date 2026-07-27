## 1. Story hero readability
In `StoryDetail.tsx`:
- Reduce orange overlay strength (from `from-primary` full → layered gradient: `from-primary/85 via-primary/50 to-transparent`) so the image is visible while text stays readable.
- Add a subtle dark underlay behind the title (`bg-black/20` + `backdrop-blur-sm` container, or `drop-shadow-lg` on the h1) to guarantee contrast on any image.
- Bump title weight/tracking and add `text-shadow`-style drop shadow utility for the headline and meta line.

## 2. Admin content editor (rename anything on the site)

### a) Rename blog categories
New tab **"Content Editor"** in Admin → **Editorial workspace**:
- Lists all `blog_categories` with inline edit for `name` (and optionally `slug`).
- Saves via `UPDATE blog_categories`.
- Existing category chips, dropdowns, and footer counts already read from that table, so renames propagate automatically.

### b) Edit story titles/excerpts
Same tab exposes a quick search over `blog_posts` with inline edit for `title` and `excerpt` (admin already has row-level access via existing policies). This covers "edit some titles" without needing to open each story.

### c) Edit arbitrary UI labels (headings, buttons, footer copy, etc.)
New table `site_strings`:
```
key text primary key      -- e.g. "home.hero.title"
value_en text
value_rw text
updated_at timestamptz
```
- Public read (anon + authenticated).
- Write restricted to `has_role(auth.uid(),'admin')`.
- Grants: SELECT to anon/authenticated, ALL to service_role, INSERT/UPDATE to authenticated (RLS enforces admin-only write).

New hook `useSiteString(key, fallback)`:
- Loads all strings once (cached in a React context, keyed by language).
- Returns `strings[key]?.[lang] ?? fallback`.

Wrap hard-coded headings on Home, Header, Footer, Stories, PlanWedding, VendorList in `t('key', 'Default text')` (the fallback keeps the site working before an admin overrides anything).

Admin **Content Editor** tab gets a third section **"UI Text"**:
- Search by key or current value.
- Two inputs per row (English / Kinyarwanda).
- "Add new string" for keys not yet seeded.
- Save → upsert into `site_strings`.

### d) Admin-only guardrails
- All writes gated by `has_role(auth.uid(),'admin')` RLS.
- Optimistic UI + toast on success/error.
- No public writes; anon can only read.

## Files
- New: `supabase` migration for `site_strings`.
- New: `src/hooks/useSiteStrings.tsx` (context + hook).
- New: `src/components/admin/ContentEditor.tsx` (3 sections: Categories, Story titles, UI strings).
- Edit: `src/pages/AdminDashboard.tsx` — mount new tab in Editorial workspace.
- Edit: `src/pages/StoryDetail.tsx` — overlay + typography contrast.
- Edit: `src/App.tsx` — wrap tree in `SiteStringsProvider`.
- Light touch: swap a handful of core headings (home hero eyebrow, footer tagline, "This week's most-read", nav labels) to use `t()` so admin has something meaningful to edit on day one. Further coverage can grow over time without another migration.

## Out of scope
- Editing text baked into third-party components or images.
- Rewriting every string on the site in one pass — the mechanism is in place, coverage expands incrementally.
