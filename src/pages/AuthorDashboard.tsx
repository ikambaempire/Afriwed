import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PenLine, Eye, Trash2, Plus, ExternalLink, Upload } from "lucide-react";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { useRef } from "react";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const AuthorDashboard = () => {
  const { user, loading, isAuthor, authorId, isAdmin } = useAuth();
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content_html: "", featured_image_url: "", status: "draft" });
  const [profileForm, setProfileForm] = useState({ display_name: "", bio: "", avatar_url: "" });

  const allowed = isAuthor || isAdmin;

  useEffect(() => {
    if (!authorId) return;
    refresh();
  }, [authorId]);

  const refresh = async () => {
    const { data: a } = await (supabase as any).from("blog_authors").select("*").eq("id", authorId).maybeSingle();
    setAuthorProfile(a);
    if (a) setProfileForm({ display_name: a.display_name || "", bio: a.bio || "", avatar_url: a.avatar_url || "" });
    const { data } = await supabase.from("blog_posts").select("*").eq("author_id", authorId!).order("updated_at", { ascending: false });
    setPosts(data ?? []);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!allowed) return <Navigate to="/author-apply" replace />;
  if (!authorId) {
    return (
      <>
        <Header />
        <main className="pt-24 container mx-auto px-4 max-w-xl text-center">
          <h1 className="font-display text-3xl mb-3">Author profile pending</h1>
          <p className="text-muted-foreground mb-6">Your author role is approved, but your profile isn't linked yet. Contact an admin to finish setup.</p>
          <Button asChild><Link to="/">Back home</Link></Button>
        </main>
      </>
    );
  }

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", slug: "", excerpt: "", content_html: "", featured_image_url: "", status: "draft" });
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt || "", content_html: p.content_html || "", featured_image_url: p.featured_image_url || "", status: p.status });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const slug = form.slug.trim() || slugify(form.title);
    const payload: any = {
      title: form.title, slug, excerpt: form.excerpt, content_html: form.content_html,
      featured_image_url: form.featured_image_url || null, status: form.status,
      author_id: authorId,
    };
    if (form.status === "publish" && !editing?.published_at) payload.published_at = new Date().toISOString();

    if (editing) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Article updated");
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Article created");
    }
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Article deleted");
    refresh();
  };

  const saveProfile = async () => {
    const { error } = await (supabase as any).from("blog_authors").update(profileForm).eq("id", authorId);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refresh();
  };

  const published = posts.filter(p => p.status === "publish");
  const drafts = posts.filter(p => p.status !== "publish");
  const totalViews = posts.reduce((s, p) => s + (p.view_count || 0), 0);

  return (
    <>
      <Helmet><title>Author Dashboard — Afriwedd</title></Helmet>
      <Header />
      <main className="pt-20 pb-16 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Author Dashboard</h1>
              <p className="text-muted-foreground text-sm">Welcome back, {authorProfile?.display_name}</p>
            </div>
            <div className="flex gap-2">
              {authorProfile?.slug && <Button asChild variant="outline"><Link to={`/authors/${authorProfile.slug}`}><ExternalLink className="w-4 h-4 mr-1" />Public profile</Link></Button>}
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" />New article</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Published</p><p className="text-2xl font-bold">{published.length}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Drafts</p><p className="text-2xl font-bold">{drafts.length}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total views</p><p className="text-2xl font-bold">{totalViews.toLocaleString()}</p></CardContent></Card>
          </div>

          <Tabs defaultValue="articles" className="space-y-6">
            <TabsList>
              <TabsTrigger value="articles">My Articles</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="articles">
              <Card>
                <CardHeader><CardTitle className="text-base">Articles ({posts.length})</CardTitle></CardHeader>
                <CardContent>
                  {posts.length === 0 ? (
                    <p className="text-center py-10 text-muted-foreground">No articles yet. <button className="text-primary underline" onClick={openNew}>Write your first one</button>.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {posts.map(p => (
                        <div key={p.id} className="py-4 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                            {p.featured_image_url && <img src={p.featured_image_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{p.title}</h3>
                              <Badge variant={p.status === "publish" ? "default" : "secondary"} className="shrink-0">{p.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-3">
                              <span><Eye className="w-3 h-3 inline mr-1" />{p.view_count || 0}</span>
                              <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                              <span className="truncate">/{p.slug}</span>
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {p.status === "publish" && <Button asChild size="sm" variant="ghost"><Link to={`/stories/${p.slug}`} target="_blank"><Eye className="w-4 h-4" /></Link></Button>}
                            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><PenLine className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader><CardTitle className="text-base">Public Author Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4 max-w-xl">
                  <div><Label>Display name</Label><Input value={profileForm.display_name} onChange={e => setProfileForm({ ...profileForm, display_name: e.target.value })} /></div>
                  <div><Label>Bio</Label><Textarea value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} rows={5} /></div>
                  <div><Label>Avatar URL</Label><Input value={profileForm.avatar_url} onChange={e => setProfileForm({ ...profileForm, avatar_url: e.target.value })} placeholder="https://..." /></div>
                  <Button onClick={saveProfile}>Save profile</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} /></div>
              <div><Label>URL slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="auto-generated from title" /></div>
              <div>
                <Label>Featured image</Label>
                <FeaturedImageInput value={form.featured_image_url} onChange={url => setForm({ ...form, featured_image_url: url })} />
              </div>
              <div><Label>Excerpt</Label><Textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} /></div>
              <div>
                <Label>Content</Label>
                <RichTextEditor key={editing?.id || "new"} value={form.content_html} onChange={html => setForm(f => ({ ...f, content_html: html }))} />
                <p className="text-xs text-muted-foreground mt-1">Use the toolbar to add images from your device, links, headings and quotes anywhere in the article.</p>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="publish">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save}>{editing ? "Save changes" : "Create article"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  );
};

export default AuthorDashboard;
