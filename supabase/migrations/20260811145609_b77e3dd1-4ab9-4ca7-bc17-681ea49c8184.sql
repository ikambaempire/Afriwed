REVOKE SELECT ON public.blog_authors FROM anon;
GRANT SELECT (id, wp_author_id, login, display_name, avatar_url, bio, created_at, slug, user_id, featured_wedding_ids, social_links) ON public.blog_authors TO anon;
GRANT SELECT ON public.blog_authors TO authenticated;