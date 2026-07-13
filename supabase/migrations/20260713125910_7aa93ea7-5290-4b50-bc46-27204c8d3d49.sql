
ALTER TABLE public.advertisements
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_text text,
  ADD COLUMN IF NOT EXISTS cta_link text,
  ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT 'below_hero',
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

ALTER TABLE public.blog_comments
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ads_public_idx ON public.advertisements(is_published, is_active, priority DESC);
CREATE INDEX IF NOT EXISTS blog_comments_status_idx ON public.blog_comments(approved, hidden);
