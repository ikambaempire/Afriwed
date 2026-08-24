DELETE FROM public.blog_post_categories WHERE post_id = '30ee17e9-1f68-484e-9ee1-a290421d9c9d';
DELETE FROM public.blog_posts WHERE id = '30ee17e9-1f68-484e-9ee1-a290421d9c9d';

GRANT SELECT, INSERT, DELETE ON public.blog_post_categories TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blog_post_tags TO authenticated;
GRANT ALL ON public.blog_post_categories TO service_role;
GRANT ALL ON public.blog_post_tags TO service_role;

CREATE POLICY "bpc authors manage own post links"
ON public.blog_post_categories FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.blog_posts p
  WHERE p.id = post_id AND p.author_id = public.current_author_id() AND p.status <> 'publish'
));

CREATE POLICY "bpc authors delete own post links"
ON public.blog_post_categories FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.blog_posts p
  WHERE p.id = post_id AND p.author_id = public.current_author_id() AND p.status <> 'publish'
));

CREATE POLICY "bpt authors manage own post links"
ON public.blog_post_tags FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.blog_posts p
  WHERE p.id = post_id AND p.author_id = public.current_author_id() AND p.status <> 'publish'
));

CREATE POLICY "bpt authors delete own post links"
ON public.blog_post_tags FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.blog_posts p
  WHERE p.id = post_id AND p.author_id = public.current_author_id() AND p.status <> 'publish'
));