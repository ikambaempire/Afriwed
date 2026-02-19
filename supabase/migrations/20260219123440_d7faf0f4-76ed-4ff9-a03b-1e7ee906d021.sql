
-- Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- Drop and recreate the problematic policies
DROP POLICY IF EXISTS "Participants can view members" ON public.conversation_participants;
CREATE POLICY "Participants can view members"
  ON public.conversation_participants
  FOR SELECT
  USING (public.is_conversation_member(auth.uid(), conversation_id));

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations
  FOR SELECT
  USING (public.is_conversation_member(auth.uid(), id));

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages"
  ON public.messages
  FOR SELECT
  USING (public.is_conversation_member(auth.uid(), conversation_id));

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_conversation_member(auth.uid(), conversation_id));
