
-- Allow conversation creator to also view their conversations
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = created_by OR public.is_conversation_member(auth.uid(), id));
