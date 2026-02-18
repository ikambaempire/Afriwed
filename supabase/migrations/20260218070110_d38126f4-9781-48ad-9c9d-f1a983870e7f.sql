
-- Conversations table (supports 1-on-1 and group chats)
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversation participants
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: participants can view
CREATE POLICY "Participants can view conversations" ON public.conversations
FOR SELECT USING (
  id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- Conversations: any authenticated user can create
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversations: creator can update
CREATE POLICY "Creator can update conversation" ON public.conversations
FOR UPDATE USING (auth.uid() = created_by);

-- Participants: participants can view other participants
CREATE POLICY "Participants can view members" ON public.conversation_participants
FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants cp WHERE cp.user_id = auth.uid())
);

-- Participants: conversation creator can add members
CREATE POLICY "Creator can add participants" ON public.conversation_participants
FOR INSERT WITH CHECK (
  conversation_id IN (SELECT id FROM public.conversations WHERE created_by = auth.uid())
  OR user_id = auth.uid()
);

-- Participants: can remove self
CREATE POLICY "Users can leave conversations" ON public.conversation_participants
FOR DELETE USING (user_id = auth.uid());

-- Messages: participants can view messages
CREATE POLICY "Participants can view messages" ON public.messages
FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- Messages: participants can send messages
CREATE POLICY "Participants can send messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Update trigger for conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
