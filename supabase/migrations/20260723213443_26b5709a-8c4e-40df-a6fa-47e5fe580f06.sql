
-- 1) blog_authors: hide email column from public/anon/authenticated readers
REVOKE SELECT (email) ON public.blog_authors FROM anon, authenticated;
GRANT SELECT (email) ON public.blog_authors TO service_role;

-- 2) vendor-media storage: enforce ownership on INSERT and restrict listing
DROP POLICY IF EXISTS "Authenticated users can upload vendor media" ON storage.objects;
CREATE POLICY "Users can upload own vendor media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Anyone can view vendor media" ON storage.objects;
CREATE POLICY "Users can list own vendor media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vendor-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
-- Note: files remain publicly accessible via CDN URLs since the bucket is public;
-- this policy only restricts listing/enumeration through the API.

-- 3) Lock down SECURITY DEFINER helper functions from direct client execution.
-- Trigger-only functions:
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Internal helpers used inside RLS policies must remain callable by the roles
-- that evaluate policies (authenticated). Revoke from anon and PUBLIC only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_author_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_vendor_booked_dates(uuid) FROM PUBLIC, anon;
