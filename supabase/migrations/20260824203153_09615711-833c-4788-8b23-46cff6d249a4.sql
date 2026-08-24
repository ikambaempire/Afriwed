DROP POLICY IF EXISTS "authors insert own posts" ON public.blog_posts;
CREATE POLICY "authors insert own posts" ON public.blog_posts
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'author'::app_role)
  AND author_id = current_author_id()
  AND status IN ('draft','pending')
);

DROP POLICY IF EXISTS "authors update own posts" ON public.blog_posts;
CREATE POLICY "authors update own posts" ON public.blog_posts
FOR UPDATE TO authenticated
USING (author_id = current_author_id() AND status <> 'publish')
WITH CHECK (author_id = current_author_id() AND status IN ('draft','pending'));

DROP POLICY IF EXISTS "authors delete own posts" ON public.blog_posts;
CREATE POLICY "authors delete own posts" ON public.blog_posts
FOR DELETE TO authenticated
USING (author_id = current_author_id() AND status <> 'publish');