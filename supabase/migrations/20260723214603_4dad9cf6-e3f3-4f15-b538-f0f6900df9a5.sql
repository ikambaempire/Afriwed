GRANT EXECUTE ON FUNCTION public.current_author_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_vendor_booked_dates(uuid) TO anon, authenticated;