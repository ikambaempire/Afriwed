ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS focus_keyword text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS canonical_url text;

DROP POLICY IF EXISTS "Editorial can upload blog media" ON storage.objects;
CREATE POLICY "Editorial can upload blog media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-media'
  AND (storage.foldername(name))[1] = 'blog'
  AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "Editorial can update blog media" ON storage.objects;
CREATE POLICY "Editorial can update blog media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'vendor-media'
  AND (storage.foldername(name))[1] = 'blog'
  AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "Editorial can read blog media" ON storage.objects;
CREATE POLICY "Editorial can read blog media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vendor-media' AND (storage.foldername(name))[1] = 'blog');