import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  MessageCircle, Send, Plus, Users, Search, ArrowLeft, UserPlus
} from "lucide-react";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  updated_at: string;
  participants: { user_id: string; email: string; full_name: string }[];
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

const Messages = () => {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participations?.length) return;

    const convoIds = participations.map(p => p.conversation_id);
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convoIds)
      .order("updated_at", { ascending: false });

    if (!convos) return;

    // Get participants for each conversation
    const enriched: Conversation[] = [];
    for (const c of convos) {
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", c.id);

      const userIds = parts?.map(p => p.user_id) ?? [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1);

      enriched.push({
        ...c,
        participants: profiles ?? [],
        last_message: lastMsg?.[0]?.content,
      });
    }
    setConversations(enriched);
  }, [user]);

  const fetchMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });

    if (!data) return;

    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", senderIds);

    const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) ?? []);
    setMessages(data.map(m => ({ ...m, sender_name: nameMap.get(m.sender_id) || "Unknown" })));
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo.id);

    const channel = supabase
      .channel(`messages-${activeConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConvo.id}`,
      }, async (payload) => {
        const msg = payload.new as Message;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", msg.sender_id)
          .maybeSingle();
        setMessages(prev => [...prev, { ...msg, sender_name: profile?.full_name || "Unknown" }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const searchVendors = async (query: string) => {
    setSearchVendor(query);
    if (query.length < 2) { setVendors([]); return; }
    const { data } = await supabase
      .from("vendors")
      .select("id, business_name, user_id, category")
      .ilike("business_name", `%${query}%`)
      .limit(10);
    setVendors(data ?? []);
  };

  const startDirectChat = async (vendorUserId: string, vendorName: string) => {
    if (!user) return;
    // Check existing 1-on-1
    const { data: myConvos } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myConvos) {
      for (const mc of myConvos) {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", mc.conversation_id);
        const { data: convo } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", mc.conversation_id)
          .eq("is_group", false)
          .maybeSingle();
        if (convo && parts?.length === 2 && parts.some(p => p.user_id === vendorUserId)) {
          setActiveConvo({ ...convo, participants: [], last_message: undefined });
          setShowNewChat(false);
          setMobileShowChat(true);
          fetchConversations();
          return;
        }
      }
    }

    const { data: convo } = await supabase
      .from("conversations")
      .insert({ name: vendorName, is_group: false, created_by: user.id })
      .select()
      .single();

    if (!convo) return;

    await supabase.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: vendorUserId },
    ]);

    setActiveConvo({ ...convo, participants: [], last_message: undefined });
    setShowNewChat(false);
    setMobileShowChat(true);
    fetchConversations();
  };

  const createGroup = async () => {
    if (!user || !groupName || selectedMembers.length === 0) return;
    const { data: convo } = await supabase
      .from("conversations")
      .insert({ name: groupName, is_group: true, created_by: user.id })
      .select()
      .single();

    if (!convo) return;

    const participants = [user.id, ...selectedMembers].map(uid => ({
      conversation_id: convo.id,
      user_id: uid,
    }));
    await supabase.from("conversation_participants").insert(participants);

    setActiveConvo({ ...convo, participants: [], last_message: undefined });
    setShowNewGroup(false);
    setGroupName("");
    setSelectedMembers([]);
    setMobileShowChat(true);
    fetchConversations();
    toast({ title: "Group created!" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo || !user) return;
    await supabase.from("messages").insert({
      conversation_id: activeConvo.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConvo.id);
    setNewMessage("");
    fetchConversations();
  };

  const getConvoDisplayName = (c: Conversation) => {
    if (c.is_group) return c.name || "Group Chat";
    const other = c.participants.find(p => p.user_id !== user?.id);
    return other?.full_name || c.name || "Chat";
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;

  return (
    <>
      <Header />
      <main className="pt-16 bg-background min-h-screen">
        <div className="container mx-auto px-0 md:px-4 h-[calc(100vh-4rem)]">
          <div className="flex h-full bg-card rounded-none md:rounded-xl overflow-hidden border border-border">
            {/* Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-xl font-bold text-foreground">Messages</h2>
                  <div className="flex gap-1">
                    <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost"><Plus className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>New Chat with Vendor</DialogTitle></DialogHeader>
                        <Input placeholder="Search vendors..." value={searchVendor} onChange={e => searchVendors(e.target.value)} />
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {vendors.map(v => (
                            <button key={v.id} onClick={() => startDirectChat(v.user_id, v.business_name)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left">
                              <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(v.business_name)}</AvatarFallback></Avatar>
                              <div><p className="text-sm font-medium text-foreground">{v.business_name}</p><p className="text-xs text-muted-foreground">{v.category}</p></div>
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost"><Users className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Create Planning Group</DialogTitle></DialogHeader>
                        <Input placeholder="Group name (e.g. Our Wedding Team)" value={groupName} onChange={e => setGroupName(e.target.value)} />
                        <Input placeholder="Search vendors to add..." value={searchVendor} onChange={e => searchVendors(e.target.value)} />
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {vendors.map(v => (
                            <button key={v.id} onClick={() => setSelectedMembers(prev => prev.includes(v.user_id) ? prev.filter(id => id !== v.user_id) : [...prev, v.user_id])}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedMembers.includes(v.user_id) ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}>
                              <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(v.business_name)}</AvatarFallback></Avatar>
                              <div><p className="text-sm font-medium text-foreground">{v.business_name}</p><p className="text-xs text-muted-foreground">{v.category}</p></div>
                            </button>
                          ))}
                        </div>
                        {selectedMembers.length > 0 && <Badge variant="secondary">{selectedMembers.length} member(s) selected</Badge>}
                        <Button onClick={createGroup} disabled={!groupName || selectedMembers.length === 0}>
                          <UserPlus className="w-4 h-4 mr-2" />Create Group
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs mt-1">Start a chat with a vendor!</p>
                  </div>
                ) : (
                  conversations.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setActiveConvo(c); setMobileShowChat(true); }}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${activeConvo?.id === c.id ? "bg-muted" : ""}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`text-xs ${c.is_group ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"}`}>
                          {c.is_group ? <Users className="w-4 h-4" /> : getInitials(getConvoDisplayName(c))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{getConvoDisplayName(c)}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.last_message || "No messages yet"}</p>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
              {activeConvo ? (
                <>
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileShowChat(false)}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={`text-xs ${activeConvo.is_group ? "bg-accent/20" : "bg-primary/10 text-primary"}`}>
                        {activeConvo.is_group ? <Users className="w-4 h-4" /> : getInitials(getConvoDisplayName(activeConvo))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-foreground">{getConvoDisplayName(activeConvo)}</p>
                      {activeConvo.is_group && (
                        <p className="text-xs text-muted-foreground">{activeConvo.participants.length} members</p>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map(m => {
                        const isMine = m.sender_id === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                              {!isMine && activeConvo.is_group && (
                                <p className="text-xs font-medium mb-1 opacity-70">{m.sender_name}</p>
                              )}
                              <p className="text-sm">{m.content}</p>
                              <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-border">
                    <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">Welcome to Afriwedd Chat</h3>
                    <p className="text-sm text-muted-foreground">Select a conversation or start a new chat with your vendors</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Messages;
