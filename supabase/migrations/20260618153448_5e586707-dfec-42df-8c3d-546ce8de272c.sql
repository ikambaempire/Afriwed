ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
CREATE INDEX IF NOT EXISTS idx_blog_posts_language ON public.blog_posts(language);
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_language_check CHECK (language IN ('en','rw'));