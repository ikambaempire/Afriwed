import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, ExternalLink, ChevronDown, ChevronRight, RefreshCw, KeyRound, Copy, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Author = {
  id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_links: any;
};

const AuthorsManagerTab = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Author | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Author | null>(null);
  const [pwAuthor, setPwAuthor] = useState<Author | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwResult, setPwResult] = useState<{ email: string; password: string } | null>(null);

  const genPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
    const arr = crypto.getRandomValues(new Uint32Array(14));
    return Array.from(arr, n => chars[n % chars.length]).join("");
  };

  const openPassword = (a: Author) => {
    setPwResult(null);
    setPwValue(genPassword());
    setPwAuthor(a);
  };

  const savePassword = async () => {
    if (!pwAuthor) return;
    if (pwValue.length < 8) { toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return; }
    setPwSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-author-password", {
      body: { author_id: pwAuthor.id, password: pwValue },
    });
    setPwSaving(false);
    const errMsg = (error as any)?.message || (data as any)?.error;
    if (errMsg) { toast({ title: "Could not set password", description: errMsg, variant: "destructive" }); return; }
    setPwResult({ email: (data as any).email, password: pwValue });
    toast({ title: (data as any).created ? "Account created" : "Password updated" });
    load();
  };

  const copyCredentials = async () => {
    if (!pwResult) return;
    await navigator.clipboard.writeText(`Afriwedd login\nEmail: ${pwResult.email}\nPassword: ${pwResult.password}`);
    toast({ title: "Credentials copied" });
  };

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: p }] = await Promise.all([
      (supabase as any).from("blog_authors").select("*").order("display_name"),
      supabase.from("blog_posts").select("id, title, slug, status, published_at, author_id").order("published_at", { ascending: false, nullsFirst: false }).limit(2000),
    ]);
    setAuthors(a ?? []);
    setPosts(p ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (a: Author) => {
    setEditing(a);
    const s = (a.social_links && typeof a.social_links === "object") ? a.social_links : {};
    setForm({
      display_name: a.display_name ?? "",
      email: a.email ?? "",
      slug: a.slug ?? "",
      bio: a.bio ?? "",
      avatar_url: a.avatar_url ?? "",
      instagram: s.instagram ?? "",
      x: s.x ?? s.twitter ?? "",
      linkedin: s.linkedin ?? "",
      website: s.website ?? "",
    });
  };

  const save = async () => {
    if (!editing) return;
    if (!form.display_name.trim()) { toast({ title: "Display name is required", variant: "destructive" }); return; }
    setSaving(true);
    const social: Record<string, string> = {};
    ["instagram", "x", "linkedin", "website"].forEach(k => { if (form[k]?.trim()) social[k] = form[k].trim(); });
    const { error } = await (supabase as any).from("blog_authors").update({
      display_name: form.display_name.trim(),
      email: form.email.trim() || null,
      slug: slugify(form.slug || form.display_name),
      bio: form.bio.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      social_links: social,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Author updated" });
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    const a = toDelete;
    setToDelete(null);
    if (!a) return;
    // Detach their stories first so nothing is lost
    const { error: pErr } = await supabase.from("blog_posts").update({ author_id: null }).eq("author_id", a.id);
    if (pErr) { toast({ title: "Error", description: pErr.message, variant: "destructive" }); return; }
    if (a.user_id) {
      await supabase.from("user_roles").delete().eq("user_id", a.user_id).eq("role", "author" as any);
    }
    const { error } = await (supabase as any).from("blog_authors").delete().eq("id", a.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Author deleted", description: "Their stories were kept and unassigned." });
    load();
  };

  const postsOf = (id: string) => posts.filter(p => p.author_id === id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">All Authors ({authors.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading authors…</p>
          ) : authors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No authors yet</p>
          ) : (
            <div className="space-y-3">
              {authors.map(a => {
                const list = postsOf(a.id);
                const published = list.filter(p => p.status === "publish").length;
                const expanded = open === a.id;
                return (
                  <div key={a.id} className="border border-border rounded-lg overflow-hidden">
                    <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setOpen(expanded ? null : a.id)}>
                        {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarImage src={a.avatar_url ?? undefined} alt={a.display_name} />
                          <AvatarFallback>{a.display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{a.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.email || "No email"} · /{a.slug}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{list.length} stories</Badge>
                        <Badge>{published} published</Badge>
                        {a.slug && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/authors/${a.slug}`} target="_blank"><ExternalLink className="w-3 h-3" /></Link>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => startEdit(a)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => openPassword(a)}><KeyRound className="w-3 h-3 mr-1" />Password</Button>
                        <Button size="sm" variant="destructive" onClick={() => setToDelete(a)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="border-t border-border bg-muted/40 divide-y divide-border">
                        {list.length === 0 ? (
                          <p className="p-4 text-sm text-muted-foreground">No stories yet</p>
                        ) : list.map(p => (
                          <div key={p.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{p.published_at ? new Date(p.published_at).toLocaleDateString() : "Unpublished"}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={p.status === "publish" ? "default" : "secondary"}>{p.status}</Badge>
                              <Button size="sm" variant="ghost" asChild><Link to={`/stories/${p.slug}`} target="_blank"><ExternalLink className="w-3 h-3" /></Link></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit author</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Display name</Label><Input value={form.display_name ?? ""} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Profile slug</Label><Input value={form.slug ?? ""} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="jane-mukamana" /></div>
            <div><Label>Avatar URL</Label><Input value={form.avatar_url ?? ""} onChange={e => setForm({ ...form, avatar_url: e.target.value })} /></div>
            <div><Label>Bio</Label><Textarea rows={3} value={form.bio ?? ""} onChange={e => setForm({ ...form, bio: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Instagram</Label><Input value={form.instagram ?? ""} onChange={e => setForm({ ...form, instagram: e.target.value })} /></div>
              <div><Label>X</Label><Input value={form.x ?? ""} onChange={e => setForm({ ...form, x: e.target.value })} /></div>
              <div><Label>LinkedIn</Label><Input value={form.linkedin ?? ""} onChange={e => setForm({ ...form, linkedin: e.target.value })} /></div>
              <div><Label>Website</Label><Input value={form.website ?? ""} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their author profile and author role will be removed. Their stories stay published but become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete author</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AuthorsManagerTab;
