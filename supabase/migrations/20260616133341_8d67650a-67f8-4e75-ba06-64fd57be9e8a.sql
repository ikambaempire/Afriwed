
ALTER TABLE public.blog_authors
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured_wedding_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

UPDATE public.blog_authors
  SET slug = regexp_replace(lower(coalesce(login, display_name, id::text)), '[^a-z0-9]+', '-', 'g')
  WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_blog_authors_user_id ON public.blog_authors(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);

CREATE TABLE IF NOT EXISTS public.author_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text,
  sample_links text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.author_applications TO authenticated;
GRANT ALL ON public.author_applications TO service_role;
ALTER TABLE public.author_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own author application" ON public.author_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users view own author application" ON public.author_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage author applications" ON public.author_applications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS author_applications_updated_at ON public.author_applications;
CREATE TRIGGER author_applications_updated_at BEFORE UPDATE ON public.author_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.current_author_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id FROM public.blog_authors WHERE user_id = auth.uid() LIMIT 1
$$;

DROP POLICY IF EXISTS "blog_posts public read published" ON public.blog_posts;
CREATE POLICY "blog_posts public read published" ON public.blog_posts
  FOR SELECT USING (status = 'publish' OR author_id = public.current_author_id() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "authors insert own posts" ON public.blog_posts;
CREATE POLICY "authors insert own posts" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'author') AND author_id = public.current_author_id());

DROP POLICY IF EXISTS "authors update own posts" ON public.blog_posts;
CREATE POLICY "authors update own posts" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (author_id = public.current_author_id())
  WITH CHECK (author_id = public.current_author_id());

DROP POLICY IF EXISTS "authors delete own posts" ON public.blog_posts;
CREATE POLICY "authors delete own posts" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (author_id = public.current_author_id());

DROP POLICY IF EXISTS "authors update own profile" ON public.blog_authors;
CREATE POLICY "authors update own profile" ON public.blog_authors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
