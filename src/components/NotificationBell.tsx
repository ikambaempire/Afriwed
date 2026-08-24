import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const dotColor = (type: string) =>
  type === "approved" ? "bg-green-600" : type === "rejected" ? "bg-destructive" : type === "changes_requested" ? "bg-amber-500" : "bg-primary";

const NotificationBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems(data ?? []);
  };

  useEffect(() => {
    if (!user) { setItems([]); return; }
    load();
    const channel = supabase
      .channel(`notifications-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((prev) => [n, ...prev]);
          toast(n.title, { description: n.body ?? undefined });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await (supabase as any).from("notifications").update({ read: true }).in("id", ids);
  };

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await (supabase as any).from("notifications").update({ read: true }).eq("id", id);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[90vw] rounded-xl border border-border bg-background shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllRead}>
                <CheckCheck className="w-3.5 h-3.5 mr-1" />Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {items.length === 0 && <p className="p-6 text-sm text-center text-muted-foreground">No notifications yet.</p>}
            {items.map((n) => {
              const inner = (
                <div className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors ${n.read ? "" : "bg-primary/5"}`}>
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotColor(n.type)}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{n.body}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={() => { markRead(n.id); setOpen(false); }} className="block">{inner}</Link>
              ) : (
                <button key={n.id} type="button" onClick={() => markRead(n.id)} className="block w-full text-left">{inner}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
