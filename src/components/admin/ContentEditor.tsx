import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteStrings } from "@/hooks/useSiteStrings";
import { Loader2, Plus, Save, Search } from "lucide-react";

type Category = { id: string; name: string; slug: string };
type Post = { id: string; title: string; excerpt: string | null; slug: string };
type SiteString = { key: string; value_en: string; value_rw: string; description: string | null };

export default function ContentEditor() {
  return (
    <div className="space-y-6">
      <CategoriesEditor />
      <StoryTitlesEditor />
      <SiteStringsEditor />
    </div>
  );
}

function CategoriesEditor() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_categories").select("id,name,slug").order("name");
    setCats((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (c: Category) => {
    setSavingId(c.id);
    const { error } = await supabase.from("blog_categories").update({ name: c.name, slug: c.slug }).eq("id", c.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success("Category updated");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Rename Categories</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : cats.map((c, i) => (
          <div key={c.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end p-3 border rounded-lg">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={c.name} onChange={e => setCats(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input value={c.slug} onChange={e => setCats(prev => prev.map((x, j) => j === i ? { ...x, slug: e.target.value } : x))} />
            </div>
            <Button size="sm" onClick={() => save(c)} disabled={savingId === c.id}>
              {savingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Save</>}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StoryTitlesEditor() {
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const search = async () => {
    if (!q.trim()) { setPosts([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id,title,excerpt,slug")
      .ilike("title", `%${q}%`)
      .limit(30);
    setPosts((data as any) || []);
    setLoading(false);
  };

  const save = async (p: Post) => {
    setSavingId(p.id);
    const { error } = await supabase.from("blog_posts").update({ title: p.title, excerpt: p.excerpt }).eq("id", p.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success("Story updated");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Edit Story Titles & Excerpts</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Search titles…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} />
          <Button onClick={search}><Search className="w-4 h-4 mr-1" />Search</Button>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {posts.map((p, i) => (
          <div key={p.id} className="p-3 border rounded-lg space-y-2">
            <Label className="text-xs">Title (/stories/{p.slug})</Label>
            <Input value={p.title} onChange={e => setPosts(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
            <Label className="text-xs">Excerpt</Label>
            <Textarea rows={2} value={p.excerpt || ""} onChange={e => setPosts(prev => prev.map((x, j) => j === i ? { ...x, excerpt: e.target.value } : x))} />
            <Button size="sm" onClick={() => save(p)} disabled={savingId === p.id}>
              {savingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Save</>}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SiteStringsEditor() {
  const { strings, refresh } = useSiteStrings();
  const [rows, setRows] = useState<SiteString[]>([]);
  const [filter, setFilter] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newRw, setNewRw] = useState("");

  useEffect(() => {
    setRows(Object.values(strings).sort((a, b) => a.key.localeCompare(b.key)));
  }, [strings]);

  const filtered = useMemo(() => {
    const f = filter.toLowerCase();
    if (!f) return rows;
    return rows.filter(r => r.key.toLowerCase().includes(f) || r.value_en.toLowerCase().includes(f) || r.value_rw.toLowerCase().includes(f));
  }, [rows, filter]);

  const save = async (r: SiteString) => {
    setSavingKey(r.key);
    const { error } = await supabase.from("site_strings").upsert({ key: r.key, value_en: r.value_en, value_rw: r.value_rw });
    setSavingKey(null);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    refresh();
  };

  const create = async () => {
    if (!newKey.trim()) return toast.error("Key required");
    const { error } = await supabase.from("site_strings").insert({ key: newKey.trim(), value_en: newEn, value_rw: newRw });
    if (error) return toast.error(error.message);
    toast.success("String added");
    setNewKey(""); setNewEn(""); setNewRw("");
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">UI Text (Headings, Buttons, Labels)</CardTitle>
        <p className="text-xs text-muted-foreground">Edit any wrapped site string in English and Kinyarwanda. Overrides show instantly across the site.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Filter by key or text…" value={filter} onChange={e => setFilter(e.target.value)} />

        <div className="p-3 border-2 border-dashed rounded-lg space-y-2 bg-muted/30">
          <Label className="text-xs font-bold">Add new string</Label>
          <Input placeholder="key (e.g. home.hero.title)" value={newKey} onChange={e => setNewKey(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder="English value" value={newEn} onChange={e => setNewEn(e.target.value)} />
            <Input placeholder="Kinyarwanda value" value={newRw} onChange={e => setNewRw(e.target.value)} />
          </div>
          <Button size="sm" onClick={create}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>

        {filtered.map((r, i) => (
          <div key={r.key} className="p-3 border rounded-lg space-y-2">
            <code className="text-xs text-muted-foreground">{r.key}</code>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">English</Label>
                <Textarea rows={2} value={r.value_en} onChange={e => setRows(prev => prev.map((x, j) => j === i ? { ...x, value_en: e.target.value } : x))} />
              </div>
              <div>
                <Label className="text-xs">Kinyarwanda</Label>
                <Textarea rows={2} value={r.value_rw} onChange={e => setRows(prev => prev.map((x, j) => j === i ? { ...x, value_rw: e.target.value } : x))} />
              </div>
            </div>
            <Button size="sm" onClick={() => save(r)} disabled={savingKey === r.key}>
              {savingKey === r.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Save</>}
            </Button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No strings yet. Add one above.</p>}
      </CardContent>
    </Card>
  );
}
