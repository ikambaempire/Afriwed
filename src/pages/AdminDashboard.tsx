import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Users, Store, DollarSign, CheckCircle, XCircle,
  ShieldCheck, Star, Eye, AlertTriangle, Megaphone, Trash2, Image as ImageIcon,
  Wallet, ArrowUpRight, PenLine, EyeOff, ExternalLink, Search, Upload, Languages
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthorApplicationsTab from "@/components/admin/AuthorApplicationsTab";
import PromoteAuthorCard from "@/components/admin/PromoteAuthorCard";
import { BookOpen, Briefcase } from "lucide-react";
import RichTextEditor from "@/components/editor/RichTextEditor";
import storyFallbackImage from "@/assets/afriwedd-story-fallback.jpg";

const StoryImageInput = ({ value, onChange }: { value: string; onChange: (url: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `blog/featured/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("vendor-media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("vendor-media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast({ title: "Featured image uploaded" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Image URL or upload from device" />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploadingImage}>
          <Upload className="w-4 h-4 mr-1" />{uploadingImage ? "Uploading..." : "Upload"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={uploadImage} />
      </div>
      {value && (
        <img
          src={value}
          alt="Story image preview"
          className="w-44 h-28 object-cover rounded-md border border-border"
          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = storyFallbackImage; }}
        />
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [mode, setMode] = useState<"marketplace" | "editorial">(() =>
    (typeof window !== "undefined" && (localStorage.getItem("admin_mode") as any)) || "marketplace"
  );
  const switchMode = (m: "marketplace" | "editorial") => {
    setMode(m);
    if (typeof window !== "undefined") localStorage.setItem("admin_mode", m);
  };

  // Ad form (create + edit)
  const emptyAdForm = {
    title: "", description: "", vendor_id: "", media_url: "", media_type: "image",
    cta_text: "", cta_link: "", position: "card_1", priority: 0,
    start_date: "", end_date: "",
  };
  const [adForm, setAdForm] = useState<any>(emptyAdForm);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const adFileRef = useRef<HTMLInputElement>(null);
  const [previewAd, setPreviewAd] = useState<any>(null);

  // Editorial (Afriwedd)
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [realWeddings, setRealWeddings] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [commentSearch, setCommentSearch] = useState("");
  const [commentFilter, setCommentFilter] = useState<"all" | "pending" | "approved" | "hidden">("all");
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<string>>(new Set());
  const pendingComments = allComments.filter((c) => !c.approved && !c.hidden);
  const [stories, setStories] = useState<any[]>([]);
  const [storySearch, setStorySearch] = useState("");
  const [storyStatusFilter, setStoryStatusFilter] = useState("all");
  const [storyLanguageFilter, setStoryLanguageFilter] = useState("all");
  const [storyEditorOpen, setStoryEditorOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [storySaving, setStorySaving] = useState(false);
  const [storyForm, setStoryForm] = useState({
    title: "", slug: "", excerpt: "", content_html: "", featured_image_url: "", status: "draft", language: "en",
  });
  const [mediaStats, setMediaStats] = useState({ pending: 0, done: 0, error: 0 });
  const [mirroring, setMirroring] = useState(false);
  const [importing, setImporting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    const [vRes, tRes, bRes, pRes, aRes, wRes, rRes] = await Promise.all([
      supabase.from("vendors").select("*").order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("advertisements").select("*").order("created_at", { ascending: false }),
      supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setVendors(vRes.data ?? []);
    setTransactions(tRes.data ?? []);
    setBookings(bRes.data ?? []);
    setProfiles(pRes.data ?? []);
    setAds(aRes.data ?? []);
    setWithdrawals(wRes.data ?? []);
    setUserRoles(rRes.data ?? []);

    const [sRes, rwRes, cmRes, storyRes, mPend, mDone, mErr] = await Promise.all([
      supabase.from("submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("real_weddings").select("*").order("created_at", { ascending: false }),
      supabase.from("blog_comments").select("*, blog_posts(title, slug)").order("created_at", { ascending: false }).limit(2000),
      supabase.from("blog_posts").select("*, author:blog_authors(display_name)").order("published_at", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false }).limit(1000),
      supabase.from("blog_media_assets").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("blog_media_assets").select("*", { count: "exact", head: true }).eq("status", "done"),
      supabase.from("blog_media_assets").select("*", { count: "exact", head: true }).eq("status", "error"),
    ]);
    setSubmissions(sRes.data ?? []);
    setRealWeddings(rwRes.data ?? []);
    setAllComments(cmRes.data ?? []);
    setStories(storyRes.data ?? []);
    setMediaStats({ pending: mPend.count ?? 0, done: mDone.count ?? 0, error: mErr.count ?? 0 });
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

  const approveSubmission = async (sub: any) => {
    if (sub.submission_type === "wedding") {
      const p = sub.payload || {};
      const slug = slugify(p.couple_names || "wedding") + "-" + sub.id.slice(0, 6);
      const galleryArr = (p.gallery || "").split("\n").map((x: string) => x.trim()).filter(Boolean);
      const { error } = await supabase.from("real_weddings").insert({
        slug, couple_names: p.couple_names || "Couple", story: p.story || "",
        location: p.location, country: p.country || "Rwanda",
        wedding_type: (p.wedding_type || "modern").toLowerCase(),
        wedding_date: p.wedding_date || null, cover_image_url: p.cover_image_url || null,
        gallery_urls: galleryArr, submitted_by: sub.submitter_id, status: "approved",
      });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else if (sub.submission_type === "vendor") {
      const p = sub.payload || {};
      const { error } = await supabase.from("vendors").insert({
        business_name: p.business_name, category: p.category, description: p.description,
        location: p.location, phone: p.phone, website: p.website,
        is_approved: true, user_id: sub.submitter_id,
      } as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    await supabase.from("submissions").update({ status: "approved" }).eq("id", sub.id);
    toast({ title: "Submission approved" });
    fetchAll();
  };

  const rejectSubmission = async (id: string) => {
    await supabase.from("submissions").update({ status: "rejected" }).eq("id", id);
    toast({ title: "Submission rejected" });
    fetchAll();
  };

  const approveComment = async (id: string, approved: boolean) => {
    await supabase.from("blog_comments").update({ approved, hidden: false }).eq("id", id);
    toast({ title: approved ? "Comment approved" : "Comment set to pending" });
    fetchAll();
  };

  const hideComment = async (id: string) => {
    await supabase.from("blog_comments").update({ hidden: true, approved: false }).eq("id", id);
    toast({ title: "Comment hidden" });
    fetchAll();
  };

  const deleteComment = async (id: string) => {
    await supabase.from("blog_comments").delete().eq("id", id);
    toast({ title: "Comment deleted permanently" });
    fetchAll();
  };

  const bulkDeleteComments = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Permanently delete ${ids.length} comment(s)? This cannot be undone.`)) return;
    const { error } = await supabase.from("blog_comments").delete().in("id", ids);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Deleted ${ids.length} comment(s)` });
    setSelectedCommentIds(new Set());
    fetchAll();
  };

  const deleteAllComments = async () => {
    if (!confirm(`Permanently delete ALL ${allComments.length} comments? This cannot be undone.`)) return;
    const { error } = await supabase.from("blog_comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "All comments deleted" });
    setSelectedCommentIds(new Set());
    fetchAll();
  };

  const deleteDefaultComments = async () => {
    // Delete comments imported from WordPress (default/sample comments)
    if (!confirm("Delete all default (imported) comments? This removes every comment with a WordPress origin.")) return;
    const { error } = await supabase.from("blog_comments").delete().not("wp_comment_id", "is", null);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Default comments deleted" });
    fetchAll();
  };

  const openStoryEditor = (story: any) => {
    setEditingStory(story);
    setStoryForm({
      title: story.title || "",
      slug: story.slug || "",
      excerpt: story.excerpt || "",
      content_html: story.content_html || "",
      featured_image_url: story.featured_image_url || "",
      status: story.status || "draft",
      language: story.language || "en",
    });
    setStoryEditorOpen(true);
  };

  const saveStory = async () => {
    if (!editingStory || !storyForm.title.trim()) {
      toast({ title: "Story title is required", variant: "destructive" });
      return;
    }
    setStorySaving(true);
    try {
      const nextStatus = storyForm.status;
      const payload: any = {
        title: storyForm.title.trim(),
        slug: storyForm.slug.trim() || slugify(storyForm.title),
        excerpt: storyForm.excerpt,
        content_html: storyForm.content_html,
        featured_image_url: storyForm.featured_image_url || null,
        status: nextStatus,
        language: storyForm.language,
      };
      if (nextStatus === "publish" && !editingStory.published_at) payload.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editingStory.id);
      if (error) throw error;
      toast({ title: "Story updated" });
      setStoryEditorOpen(false);
      fetchAll();
    } catch (error: any) {
      toast({ title: "Story update failed", description: error.message, variant: "destructive" });
    } finally {
      setStorySaving(false);
    }
  };

  const updateStoryStatus = async (story: any, status: "draft" | "publish") => {
    const payload: any = { status };
    if (status === "publish" && !story.published_at) payload.published_at = new Date().toISOString();
    const { error } = await supabase.from("blog_posts").update(payload).eq("id", story.id);
    if (error) return toast({ title: "Status change failed", description: error.message, variant: "destructive" });
    toast({ title: status === "publish" ? "Story published" : "Story hidden" });
    fetchAll();
  };

  const deleteStory = async (story: any) => {
    if (!confirm(`Delete “${story.title}”? This cannot be undone.`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", story.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Story deleted" });
    fetchAll();
  };

  const toggleRealWeddingStatus = async (id: string, status: string) => {
    await supabase.from("real_weddings").update({ status }).eq("id", id);
    fetchAll();
  };

  const runMirror = async () => {
    setMirroring(true);
    try {
      const { data, error } = await supabase.functions.invoke("mirror-wp-images", { body: { batch: 50, chunk: 10, background: false } });
      if (error) throw error;
      toast({ title: "Image mirror batch done", description: `Succeeded ${data?.succeeded ?? 0} · Failed ${data?.failed ?? 0} · ${data?.remaining ?? 0} remaining` });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Mirror failed", description: e.message, variant: "destructive" });
    } finally {
      setMirroring(false);
    }
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-wp-posts", { body: { perPage: 50, maxPages: 40 } });
      if (error) throw error;
      toast({ title: "Import complete", description: `Inserted ${data?.inserted ?? 0} · Skipped ${data?.skipped ?? 0} · Queued ${data?.queuedImages ?? 0} images` });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const retryErrored = async () => {
    setRetrying(true);
    try {
      const { error, count } = await supabase.from("blog_media_assets").update({ status: "pending", error: null }, { count: "exact" }).eq("status", "error");
      if (error) throw error;
      toast({ title: "Retry queued", description: `${count ?? 0} assets re-queued` });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Retry failed", description: e.message, variant: "destructive" });
    } finally {
      setRetrying(false);
    }
  };

  const toggleStorySelected = (id: string) => {
    setSelectedStoryIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const runBulk = async (label: string, patch: any) => {
    if (selectedStoryIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedStoryIds);
      if (patch.status === "publish") patch.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts").update(patch).in("id", ids);
      if (error) throw error;
      toast({ title: `${label} · ${ids.length} stories` });
      setSelectedStoryIds(new Set());
      fetchAll();
    } catch (e: any) {
      toast({ title: "Bulk update failed", description: e.message, variant: "destructive" });
    } finally { setBulkBusy(false); }
  };
  const bulkDelete = async () => {
    if (selectedStoryIds.size === 0) return;
    if (!confirm(`Delete ${selectedStoryIds.size} stories? This cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedStoryIds);
      const { error } = await supabase.from("blog_posts").delete().in("id", ids);
      if (error) throw error;
      toast({ title: `Deleted ${ids.length} stories` });
      setSelectedStoryIds(new Set());
      fetchAll();
    } catch (e: any) {
      toast({ title: "Bulk delete failed", description: e.message, variant: "destructive" });
    } finally { setBulkBusy(false); }
  };




  const approveVendor = async (id: string, approved: boolean) => {
    await supabase.from("vendors").update({ is_approved: approved }).eq("id", id);
    toast({ title: approved ? "Vendor approved" : "Vendor suspended" });
    fetchAll();
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    await supabase.from("vendors").update({ is_featured: featured }).eq("id", id);
    toast({ title: featured ? "Vendor featured" : "Removed from featured" });
    fetchAll();
  };

  const toggleVerified = async (id: string, verified: boolean) => {
    await supabase.from("vendors").update({ is_verified: verified }).eq("id", id);
    toast({ title: verified ? "Vendor verified" : "Verification removed" });
    fetchAll();
  };

  const handleAdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `ads/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("vendor-media").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("vendor-media").getPublicUrl(path);
    setAdForm((f: any) => ({
      ...f,
      media_url: publicUrl.publicUrl,
      media_type: file.type.startsWith("video") ? "video" : "image",
    }));
    setUploading(false);
  };

  const resetAdForm = () => { setAdForm(emptyAdForm); setEditingAdId(null); };

  const openEditAd = (ad: any) => {
    setEditingAdId(ad.id);
    setAdForm({
      title: ad.title || "",
      description: ad.description || "",
      vendor_id: ad.vendor_id || "",
      media_url: ad.media_url || "",
      media_type: ad.media_type || "image",
      cta_text: ad.cta_text || "",
      cta_link: ad.cta_link || "",
      position: ad.position || "below_hero",
      priority: ad.priority ?? 0,
      start_date: ad.start_date ? ad.start_date.slice(0, 10) : "",
      end_date: ad.end_date ? ad.end_date.slice(0, 10) : "",
    });
  };

  const saveAd = async (publish: boolean) => {
    if (!adForm.title || !adForm.media_url) {
      toast({ title: "Title and media are required", variant: "destructive" });
      return;
    }
    const payload: any = {
      title: adForm.title,
      description: adForm.description || null,
      media_url: adForm.media_url,
      media_type: adForm.media_type,
      vendor_id: adForm.vendor_id || null,
      cta_text: adForm.cta_text || null,
      cta_link: adForm.cta_link || null,
      position: adForm.position || "below_hero",
      priority: Number(adForm.priority) || 0,
      start_date: adForm.start_date || null,
      end_date: adForm.end_date || null,
      is_published: publish,
      is_active: publish ? true : false,
    };
    const { error } = editingAdId
      ? await supabase.from("advertisements").update(payload).eq("id", editingAdId)
      : await supabase.from("advertisements").insert(payload);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: publish ? (editingAdId ? "Ad updated & published" : "Advertisement published!") : "Draft saved" });
    resetAdForm();
    fetchAll();
  };

  const toggleAdActive = async (id: string, active: boolean) => {
    await supabase.from("advertisements").update({ is_active: active }).eq("id", id);
    toast({ title: active ? "Ad activated" : "Ad deactivated" });
    fetchAll();
  };

  const toggleAdPublished = async (id: string, published: boolean) => {
    await supabase.from("advertisements").update({ is_published: published, is_active: published }).eq("id", id);
    toast({ title: published ? "Ad published live" : "Ad moved to draft" });
    fetchAll();
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Permanently delete this advertisement? This cannot be undone.")) return;
    await supabase.from("advertisements").delete().eq("id", id);
    toast({ title: "Ad deleted permanently" });
    fetchAll();
  };


  const processWithdrawal = async (id: string, status: "completed" | "rejected", notes?: string) => {
    await supabase.from("withdrawal_requests").update({
      status,
      admin_notes: notes || null,
      processed_at: new Date().toISOString(),
    }).eq("id", id);
    toast({ title: status === "completed" ? "Withdrawal processed" : "Withdrawal rejected" });
    fetchAll();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <ShieldCheck className="w-16 h-16 text-muted-foreground" />
      <h2 className="font-display text-2xl font-bold text-foreground">Admin Access Required</h2>
      <p className="text-muted-foreground">You don't have admin privileges.</p>
      <Button onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );

  const totalRevenue = transactions.reduce((s, t) => s + (t.commission || 0), 0);
  const totalDeposits = transactions.filter(t => t.status === "completed").reduce((s, t) => s + (t.amount || 0), 0);
  const totalPaidOut = withdrawals.filter(w => w.status === "completed").reduce((s, w) => s + (w.net_amount || 0), 0);
  const walletBalance = totalDeposits - totalPaidOut;
  const pendingVendors = vendors.filter(v => !v.is_approved).length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");
  const filteredStories = stories.filter((story) => {
    const q = storySearch.trim().toLowerCase();
    const matchesSearch = !q || `${story.title || ""} ${story.slug || ""}`.toLowerCase().includes(q);
    const matchesStatus = storyStatusFilter === "all" || story.status === storyStatusFilter;
    const matchesLanguage = storyLanguageFilter === "all" || (story.language || "en") === storyLanguageFilter;
    return matchesSearch && matchesStatus && matchesLanguage;
  });

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Choose a workspace to manage</p>
          </div>

          {/* Workspace switcher */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => switchMode("marketplace")}
              className={`text-left p-5 rounded-xl border-2 transition-all ${mode === "marketplace" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/40"}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Briefcase className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="font-display text-lg font-bold">Afriwedd — Wedding Marketplace</p>
                  <p className="text-xs text-muted-foreground">Vendors, bookings, payments & withdrawals</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => switchMode("editorial")}
              className={`text-left p-5 rounded-xl border-2 transition-all ${mode === "editorial" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/40"}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="font-display text-lg font-bold">Afriwedd — Editorial Management</p>
                  <p className="text-xs text-muted-foreground">Articles, authors, submissions & comments</p>
                </div>
              </div>
            </button>
          </div>

          {/* Stats — contextual */}
          {mode === "marketplace" ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Wallet className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Admin Wallet</p><p className="text-xl font-bold text-foreground">{walletBalance.toLocaleString()} RWF</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Commission Earned</p><p className="text-xl font-bold text-foreground">{totalRevenue.toLocaleString()} RWF</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Store className="w-8 h-8 text-accent" /><div><p className="text-xs text-muted-foreground">Total Vendors</p><p className="text-xl font-bold text-foreground">{vendors.length}</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total Users</p><p className="text-xl font-bold text-foreground">{profiles.length}</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-destructive" /><div><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold text-foreground">{pendingVendors + pendingWithdrawals.length}</p></div></div></CardContent></Card>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><BookOpen className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Published Stories</p><p className="text-xl font-bold text-foreground">{stories.filter(s => s.status === "publish").length}</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-accent" /><div><p className="text-xs text-muted-foreground">Pending Submissions</p><p className="text-xl font-bold text-foreground">{submissions.filter(s => s.status === "pending").length}</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-destructive" /><div><p className="text-xs text-muted-foreground">Pending Comments</p><p className="text-xl font-bold text-foreground">{pendingComments.length}</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ImageIcon className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Images to mirror</p><p className="text-xl font-bold text-foreground">{mediaStats.pending}</p></div></div></CardContent></Card>
            </div>
          )}

          {mode === "marketplace" ? (
          <Tabs defaultValue="wallet" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="wallet">Wallet & Withdrawals</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="ads">Advertisements</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            {/* Wallet & Withdrawals Tab */}
            <TabsContent value="wallet">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" />Platform Wallet</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Deposits Received</span>
                        <span className="font-medium text-foreground">{totalDeposits.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Paid to Vendors</span>
                        <span className="font-medium text-foreground">{totalPaidOut.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Commission Earned</span>
                        <span className="font-medium text-primary">{totalRevenue.toLocaleString()} RWF</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                        <span className="text-foreground">Current Balance</span>
                        <span className="text-primary">{walletBalance.toLocaleString()} RWF</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">All client payments flow into the admin wallet. When vendors request withdrawals, you deduct 10% commission and send the rest to their account.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-accent" />
                      Pending Withdrawals ({pendingWithdrawals.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingWithdrawals.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No pending withdrawals</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingWithdrawals.map(w => {
                          const vendor = vendors.find(v => v.id === w.vendor_id);
                          return (
                            <div key={w.id} className="p-4 bg-muted rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">{vendor?.business_name || "Unknown Vendor"}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-foreground">{(w.amount || 0).toLocaleString()} RWF</p>
                                  <p className="text-xs text-primary">Commission: {(w.commission || 0).toLocaleString()} RWF</p>
                                  <p className="text-xs font-medium text-foreground">Send: {(w.net_amount || 0).toLocaleString()} RWF</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => processWithdrawal(w.id, "completed")}>
                                  <CheckCircle className="w-3 h-3 mr-1" />Mark as Sent
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => processWithdrawal(w.id, "rejected", "Insufficient details")}>
                                  <XCircle className="w-3 h-3 mr-1" />Reject
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* All Withdrawals History */}
              {withdrawals.filter(w => w.status !== "pending").length > 0 && (
                <Card className="mt-6">
                  <CardHeader><CardTitle className="text-lg">Withdrawal History</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {withdrawals.filter(w => w.status !== "pending").map(w => {
                        const vendor = vendors.find(v => v.id === w.vendor_id);
                        return (
                          <div key={w.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={w.status === "completed" ? "default" : "destructive"} className="text-xs">{w.status}</Badge>
                                <span className="text-sm font-medium text-foreground">{vendor?.business_name || "Unknown"}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{w.processed_at ? new Date(w.processed_at).toLocaleDateString() : new Date(w.created_at).toLocaleDateString()}</p>
                              {w.admin_notes && <p className="text-xs text-muted-foreground">{w.admin_notes}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{(w.net_amount || 0).toLocaleString()} RWF</p>
                              <p className="text-xs text-muted-foreground">Fee: {(w.commission || 0).toLocaleString()} RWF</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Vendors Tab */}
            <TabsContent value="vendors">
              <Card>
                <CardHeader><CardTitle className="text-lg">All Vendors ({vendors.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vendors.map(v => (
                      <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          {v.logo_url ? <img src={v.logo_url} className="w-10 h-10 rounded-full object-cover" /> : <Store className="w-10 h-10 text-muted-foreground p-2 bg-background rounded-full" />}
                          <div>
                            <p className="font-medium text-foreground">{v.business_name}</p>
                            <p className="text-xs text-muted-foreground">{v.category} • {v.location}</p>
                            <div className="flex gap-1 mt-1">
                              {v.is_approved && <Badge variant="default" className="text-xs">Approved</Badge>}
                              {v.is_verified && <Badge variant="outline" className="text-xs border-primary text-primary">Verified</Badge>}
                              {v.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                              {!v.is_approved && <Badge variant="destructive" className="text-xs">Pending</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {!v.is_approved ? (
                            <Button size="sm" onClick={() => approveVendor(v.id, true)}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => approveVendor(v.id, false)}><XCircle className="w-3 h-3 mr-1" />Suspend</Button>
                          )}
                          <Button size="sm" variant={v.is_featured ? "secondary" : "outline"} onClick={() => toggleFeatured(v.id, !v.is_featured)}>
                            <Star className="w-3 h-3 mr-1" />{v.is_featured ? "Unfeature" : "Feature"}
                          </Button>
                          <Button size="sm" variant={v.is_verified ? "secondary" : "outline"} onClick={() => toggleVerified(v.id, !v.is_verified)}>
                            <ShieldCheck className="w-3 h-3 mr-1" />{v.is_verified ? "Unverify" : "Verify"}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {vendors.length === 0 && <p className="text-center py-8 text-muted-foreground">No vendors yet</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advertisements Tab */}
            <TabsContent value="ads">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    {editingAdId ? "Edit Advertisement" : "Create Advertisement"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Ad Title *</Label>
                      <Input value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} placeholder="e.g. Featured Photographer" />
                    </div>
                    <div className="space-y-2">
                      <Label>Link to Vendor (optional)</Label>
                      <Select value={adForm.vendor_id || "__none__"} onValueChange={(v) => setAdForm({ ...adForm, vendor_id: v === "__none__" ? "" : v })}>
                        <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— None —</SelectItem>
                          {vendors.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.business_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={adForm.description} onChange={e => setAdForm({ ...adForm, description: e.target.value })} placeholder="Short ad description..." rows={2} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>CTA Button Text</Label>
                      <Input value={adForm.cta_text} onChange={e => setAdForm({ ...adForm, cta_text: e.target.value })} placeholder="Learn more" />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Link</Label>
                      <Input value={adForm.cta_link} onChange={e => setAdForm({ ...adForm, cta_link: e.target.value })} placeholder="https://... or /vendors" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select value={adForm.position} onValueChange={(v) => setAdForm({ ...adForm, position: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="below_hero">Below Hero</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                          <SelectItem value="footer">Footer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Display Priority</Label>
                      <Input type="number" value={adForm.priority} onChange={e => setAdForm({ ...adForm, priority: e.target.value })} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={adForm.start_date} onChange={e => setAdForm({ ...adForm, start_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={adForm.end_date} onChange={e => setAdForm({ ...adForm, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Banner Image / Video *</Label>
                    <input ref={adFileRef} type="file" accept="image/*,video/*" hidden onChange={handleAdUpload} />
                    <div className="flex gap-3 items-center flex-wrap">
                      <Button variant="outline" onClick={() => adFileRef.current?.click()} disabled={uploading} type="button">
                        <ImageIcon className="w-4 h-4 mr-2" />{uploading ? "Uploading..." : "Upload Media"}
                      </Button>
                      {adForm.media_url && <Badge variant="secondary">✓ Media ready</Badge>}
                    </div>
                    {adForm.media_url && (
                      <div className="mt-2 rounded-lg overflow-hidden max-w-xs border border-border">
                        {adForm.media_type === "video" ? (
                          <video src={adForm.media_url} className="w-full h-32 object-cover" controls />
                        ) : (
                          <img src={adForm.media_url} alt="Preview" className="w-full h-32 object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                    <Button onClick={() => saveAd(true)} disabled={!adForm.title || !adForm.media_url}>
                      <Megaphone className="w-4 h-4 mr-2" />{editingAdId ? "Update & Publish" : "Publish"}
                    </Button>
                    <Button variant="outline" onClick={() => saveAd(false)} disabled={!adForm.title || !adForm.media_url}>
                      Save as Draft
                    </Button>
                    {adForm.media_url && (
                      <Button variant="ghost" type="button" onClick={() => setPreviewAd({ ...adForm })}>
                        <Eye className="w-4 h-4 mr-1" />Preview
                      </Button>
                    )}
                    {editingAdId && (
                      <Button variant="ghost" onClick={resetAdForm}>Cancel edit</Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between flex-wrap gap-2">
                    <span>All Advertisements ({ads.length})</span>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="default">{ads.filter(a => a.is_published && a.is_active).length} live</Badge>
                      <Badge variant="secondary">{ads.filter(a => !a.is_published).length} draft</Badge>
                      <Badge variant="outline">{ads.filter(a => a.is_published && !a.is_active).length} inactive</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ads.map(ad => {
                      const live = ad.is_published && ad.is_active;
                      return (
                      <div key={ad.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                            {ad.media_type === "video" ? (
                              <video src={ad.media_url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={ad.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{ad.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-md">{ad.description}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Badge variant={live ? "default" : ad.is_published ? "outline" : "secondary"} className="text-xs">
                                {live ? "Live" : ad.is_published ? "Inactive" : "Draft"}
                              </Badge>
                              {ad.position && <Badge variant="outline" className="text-xs">{ad.position}</Badge>}
                              {ad.priority > 0 && <Badge variant="outline" className="text-xs">P{ad.priority}</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewAd(ad)}><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => openEditAd(ad)}><PenLine className="w-4 h-4 mr-1" />Edit</Button>
                          {ad.is_published ? (
                            <Button size="sm" variant="outline" onClick={() => toggleAdPublished(ad.id, false)}>Unpublish</Button>
                          ) : (
                            <Button size="sm" onClick={() => toggleAdPublished(ad.id, true)}>Publish</Button>
                          )}
                          {ad.is_published && (
                            <Button size="sm" variant="outline" onClick={() => toggleAdActive(ad.id, !ad.is_active)}>
                              {ad.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAd(ad.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );})}
                    {ads.length === 0 && <p className="text-center py-8 text-muted-foreground">No advertisements yet</p>}
                  </div>
                </CardContent>
              </Card>

              <Dialog open={!!previewAd} onOpenChange={(o) => !o && setPreviewAd(null)}>
                <DialogContent className="w-[95vw] max-w-2xl">
                  <DialogHeader><DialogTitle>Advertisement preview</DialogTitle></DialogHeader>
                  {previewAd && (
                    <div className="relative rounded-xl overflow-hidden">
                      {previewAd.media_type === "video" ? (
                        <video src={previewAd.media_url} className="w-full h-72 object-cover" controls />
                      ) : (
                        <img src={previewAd.media_url} className="w-full h-72 object-cover" alt="" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground">
                        <h3 className="font-display text-2xl font-bold">{previewAd.title}</h3>
                        {previewAd.description && <p className="text-sm mt-1 text-primary-foreground/80">{previewAd.description}</p>}
                        {(previewAd.cta_text || previewAd.cta_link) && (
                          <span className="inline-flex items-center gap-1 mt-3 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
                            {previewAd.cta_text || "Learn more"} <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>



            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader><CardTitle className="text-lg">All Transactions ({transactions.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <Badge variant={t.status === "completed" ? "default" : t.status === "pending" ? "secondary" : "destructive"}>{t.status}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{t.payment_method.toUpperCase()} • {new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{(t.amount || 0).toLocaleString()} RWF</p>
                          <p className="text-xs text-primary font-medium">Commission: {(t.commission || 0).toLocaleString()} RWF</p>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && <p className="text-center py-8 text-muted-foreground">No transactions yet</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader><CardTitle className="text-lg">All Bookings ({bookings.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={b.status === "confirmed" ? "default" : b.status === "pending" ? "secondary" : "destructive"}>{b.status}</Badge>
                            <Badge variant={b.payment_status === "paid" ? "default" : "outline"} className="text-xs">
                              {b.payment_status === "paid" ? "💰 Paid" : "Unpaid"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Event: {new Date(b.event_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{(b.total_amount || 0).toLocaleString()} RWF</p>
                          <p className="text-xs text-muted-foreground">Deposit: {(b.deposit_amount || 0).toLocaleString()} RWF</p>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="text-center py-8 text-muted-foreground">No bookings yet</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader><CardTitle className="text-lg">All Users ({profiles.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profiles.map(p => {
                      const isUserAdmin = userRoles.some(r => r.user_id === p.user_id && r.role === "admin");
                      const toggleAdmin = async () => {
                        if (!p.user_id) return;
                        if (isUserAdmin) {
                          if (p.user_id === user?.id) {
                            toast({ title: "You can't remove your own admin role", variant: "destructive" });
                            return;
                          }
                          const { error } = await supabase
                            .from("user_roles")
                            .delete()
                            .eq("user_id", p.user_id)
                            .eq("role", "admin");
                          if (error) {
                            toast({ title: "Failed to remove admin", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: "Admin role removed" });
                            fetchAll();
                          }
                        } else {
                          const { error } = await supabase
                            .from("user_roles")
                            .insert({ user_id: p.user_id, role: "admin" as any });
                          if (error) {
                            toast({ title: "Failed to grant admin", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: `${p.full_name || p.email} is now an admin` });
                            fetchAll();
                          }
                        }
                      };
                      return (
                        <div key={p.id} className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                          {p.avatar_url ? <img src={p.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : <Users className="w-10 h-10 p-2 bg-background rounded-full text-muted-foreground" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground truncate">{p.full_name || "Unnamed"}</p>
                              {isUserAdmin && <Badge variant="secondary" className="gap-1"><ShieldCheck className="w-3 h-3" />Admin</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={isUserAdmin ? "outline" : "default"}
                            onClick={toggleAdmin}
                          >
                            {isUserAdmin ? "Remove admin" : "Make admin"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
          ) : (
          <Tabs defaultValue="stories" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="stories">Stories</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="real-weddings">Real Weddings</TabsTrigger>
              <TabsTrigger value="authors">Authors</TabsTrigger>
              <TabsTrigger value="mirror">Image Mirror</TabsTrigger>
            </TabsList>

            <TabsContent value="stories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Stories ({filteredStories.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-[1fr_180px_180px] gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={storySearch} onChange={(event) => setStorySearch(event.target.value)} placeholder="Search by title or slug" className="pl-9" />
                    </div>
                    <Select value={storyStatusFilter} onValueChange={setStoryStatusFilter}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="publish">Published</SelectItem>
                        <SelectItem value="draft">Hidden / Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={storyLanguageFilter} onValueChange={setStoryLanguageFilter}>
                      <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All languages</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="rw">Kinyarwanda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk action bar */}
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-muted/40">
                    <label className="flex items-center gap-2 text-sm font-medium mr-2">
                      <Checkbox
                        checked={filteredStories.length > 0 && filteredStories.every((s) => selectedStoryIds.has(s.id))}
                        onCheckedChange={(v) => {
                          if (v) setSelectedStoryIds(new Set(filteredStories.map((s) => s.id)));
                          else setSelectedStoryIds(new Set());
                        }}
                      />
                      Select all ({selectedStoryIds.size})
                    </label>
                    <div className="flex flex-wrap gap-2 ml-auto">
                      <Button size="sm" disabled={bulkBusy || selectedStoryIds.size === 0} onClick={() => runBulk("Published", { status: "publish" })}><Eye className="w-4 h-4 mr-1" />Publish</Button>
                      <Button size="sm" variant="outline" disabled={bulkBusy || selectedStoryIds.size === 0} onClick={() => runBulk("Hidden", { status: "draft" })}><EyeOff className="w-4 h-4 mr-1" />Hide</Button>
                      <Button size="sm" variant="outline" disabled={bulkBusy || selectedStoryIds.size === 0} onClick={() => runBulk("Set to English", { language: "en" })}><Languages className="w-4 h-4 mr-1" />→ English</Button>
                      <Button size="sm" variant="outline" disabled={bulkBusy || selectedStoryIds.size === 0} onClick={() => runBulk("Set to Kinyarwanda", { language: "rw" })}><Languages className="w-4 h-4 mr-1" />→ Kinyarwanda</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" disabled={bulkBusy || selectedStoryIds.size === 0} onClick={bulkDelete}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
                    </div>
                  </div>

                  <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                    {filteredStories.map((story) => (
                      <div key={story.id} className={`p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-4 ${selectedStoryIds.has(story.id) ? "bg-primary/5" : "bg-card"}`}>
                        <Checkbox
                          checked={selectedStoryIds.has(story.id)}
                          onCheckedChange={() => toggleStorySelected(story.id)}
                          className="mt-1 md:mt-0"
                        />
                        <div className="w-full md:w-24 aspect-[4/3] rounded-md overflow-hidden bg-muted shrink-0">
                          <img
                            src={story.featured_image_url || storyFallbackImage}
                            alt={story.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = storyFallbackImage; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground line-clamp-1">{story.title}</h3>
                            <Badge variant={story.status === "publish" ? "default" : "secondary"}>{story.status === "publish" ? "Published" : "Hidden"}</Badge>
                            <Badge variant="outline">{(story.language || "en") === "rw" ? "Kinyarwanda" : "English"}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {story.author?.display_name || "No author"} · {story.published_at ? new Date(story.published_at).toLocaleDateString() : "Not published"} · /{story.slug}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap md:justify-end">
                          {story.status === "publish" && (
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/stories/${story.slug}`} target="_blank"><ExternalLink className="w-4 h-4 mr-1" />View</Link>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openStoryEditor(story)}><PenLine className="w-4 h-4 mr-1" />Edit</Button>
                          {story.status === "publish" ? (
                            <Button size="sm" variant="outline" onClick={() => updateStoryStatus(story, "draft")}><EyeOff className="w-4 h-4 mr-1" />Hide</Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => updateStoryStatus(story, "publish")}><Eye className="w-4 h-4 mr-1" />Publish</Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteStory(story)}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
                        </div>
                      </div>
                    ))}
                    {filteredStories.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">No stories match these filters.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Pending Submissions ({submissions.filter(s => s.status === "pending").length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {submissions.filter(s => s.status === "pending").length === 0 && <p className="text-sm text-muted-foreground">No pending submissions.</p>}
                  {submissions.filter(s => s.status === "pending").map(s => (
                    <div key={s.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div>
                          <Badge variant="outline" className="mb-2 capitalize">{s.submission_type}</Badge>
                          <p className="font-semibold text-foreground">{s.payload?.couple_names || s.payload?.business_name || s.submitter_name}</p>
                          <p className="text-xs text-muted-foreground">{s.submitter_email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveSubmission(s)}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => rejectSubmission(s.id)}><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                        </div>
                      </div>
                      <pre className="text-xs bg-muted/50 rounded p-2 overflow-auto max-h-40">{JSON.stringify(s.payload, null, 2)}</pre>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              {(() => {
                const stats = {
                  total: allComments.length,
                  approved: allComments.filter(c => c.approved && !c.hidden).length,
                  pending: allComments.filter(c => !c.approved && !c.hidden).length,
                  hidden: allComments.filter(c => c.hidden).length,
                  defaults: allComments.filter(c => c.wp_comment_id != null).length,
                };
                const q = commentSearch.trim().toLowerCase();
                const filtered = allComments.filter((c) => {
                  const status = c.hidden ? "hidden" : c.approved ? "approved" : "pending";
                  if (commentFilter !== "all" && commentFilter !== status) return false;
                  if (!q) return true;
                  return (
                    (c.author_name || "").toLowerCase().includes(q) ||
                    (c.author_email || "").toLowerCase().includes(q) ||
                    (c.content || "").toLowerCase().includes(q) ||
                    (c.blog_posts?.title || "").toLowerCase().includes(q)
                  );
                });
                const allSelected = filtered.length > 0 && filtered.every(c => selectedCommentIds.has(c.id));
                const toggleAll = () => {
                  const next = new Set(selectedCommentIds);
                  if (allSelected) filtered.forEach(c => next.delete(c.id));
                  else filtered.forEach(c => next.add(c.id));
                  setSelectedCommentIds(next);
                };
                const toggleOne = (id: string) => {
                  const next = new Set(selectedCommentIds);
                  next.has(id) ? next.delete(id) : next.add(id);
                  setSelectedCommentIds(next);
                };
                return (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: "Total", value: stats.total, color: "text-foreground" },
                        { label: "Approved", value: stats.approved, color: "text-green-600" },
                        { label: "Pending", value: stats.pending, color: "text-accent" },
                        { label: "Hidden", value: stats.hidden, color: "text-destructive" },
                      ].map((s) => (
                        <Card key={s.label}><CardContent className="pt-5">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </CardContent></Card>
                      ))}
                    </div>

                    <Card>
                      <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-lg">Comments ({filtered.length})</CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={deleteDefaultComments} disabled={stats.defaults === 0}>
                              <Trash2 className="w-4 h-4 mr-1" />Delete default ({stats.defaults})
                            </Button>
                            <Button size="sm" variant="destructive" onClick={deleteAllComments} disabled={stats.total === 0}>
                              Delete all comments
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <div className="relative flex-1 min-w-[220px]">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input value={commentSearch} onChange={e => setCommentSearch(e.target.value)} placeholder="Search author, email, story or content..." className="pl-9" />
                          </div>
                          <Select value={commentFilter} onValueChange={(v: any) => setCommentFilter(v)}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All statuses</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="hidden">Hidden</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedCommentIds.size > 0 && (
                          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                            <span className="text-sm">{selectedCommentIds.size} selected</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setSelectedCommentIds(new Set())}>Clear</Button>
                              <Button size="sm" variant="destructive" onClick={() => bulkDeleteComments(Array.from(selectedCommentIds))}>
                                <Trash2 className="w-4 h-4 mr-1" />Delete selected
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {filtered.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No comments match your filters.</p>}
                        {filtered.length > 0 && (
                          <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                            <span className="text-xs text-muted-foreground">Select all on page</span>
                          </div>
                        )}
                        {filtered.slice(0, 200).map(c => {
                          const status = c.hidden ? "hidden" : c.approved ? "approved" : "pending";
                          return (
                            <div key={c.id} className="border border-border rounded-lg p-3">
                              <div className="flex justify-between items-start gap-3 mb-2">
                                <div className="flex items-start gap-2 min-w-0">
                                  <Checkbox className="mt-1" checked={selectedCommentIds.has(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {c.author_name}
                                      {c.author_email && <span className="text-xs text-muted-foreground ml-2">&lt;{c.author_email}&gt;</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      on <Link className="underline" to={`/stories/${c.blog_posts?.slug || ""}`} target="_blank">{c.blog_posts?.title || "—"}</Link>
                                      {" · "}{new Date(c.created_at).toLocaleDateString()}
                                      {" · "}<Badge variant={status === "approved" ? "default" : status === "hidden" ? "destructive" : "secondary"} className="text-[10px] ml-1 capitalize">{status}</Badge>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  {status !== "approved" && (
                                    <Button size="sm" variant="outline" onClick={() => approveComment(c.id, true)} title="Approve"><CheckCircle className="w-4 h-4" /></Button>
                                  )}
                                  {status !== "hidden" && (
                                    <Button size="sm" variant="outline" onClick={() => hideComment(c.id)} title="Hide"><EyeOff className="w-4 h-4" /></Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteComment(c.id)} title="Delete permanently"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                              </div>
                              <p className="text-sm text-foreground/80 pl-6">{(c.content || "").replace(/<[^>]+>/g, "").slice(0, 300)}</p>
                            </div>
                          );
                        })}
                        {filtered.length > 200 && (
                          <p className="text-xs text-muted-foreground text-center pt-3">Showing first 200 of {filtered.length}. Refine your search to see more.</p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>


            <TabsContent value="real-weddings">
              <Card>
                <CardHeader><CardTitle className="text-lg">Real Weddings ({realWeddings.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {realWeddings.length === 0 && <p className="text-sm text-muted-foreground">No real weddings yet.</p>}
                  {realWeddings.map(w => (
                    <div key={w.id} className="flex justify-between items-center border border-border rounded-lg p-3">
                      <div>
                        <p className="font-medium text-foreground">{w.couple_names}</p>
                        <p className="text-xs text-muted-foreground">{w.location} · <Badge variant={w.status === "approved" ? "default" : "outline"} className="capitalize">{w.status}</Badge></p>
                      </div>
                      <Select value={w.status} onValueChange={(v) => toggleRealWeddingStatus(w.id, v)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="authors" className="space-y-6">
              <PromoteAuthorCard onDone={fetchAll} />
              <AuthorApplicationsTab />
            </TabsContent>

            <TabsContent value="mirror" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Import stories from afriwedd.com</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={runImport} disabled={importing}>
                    {importing ? "Importing..." : "Import missing stories"}
                  </Button>
                  <p className="text-xs text-muted-foreground">Fetches every published post from afriwedd.com, inserts any that are missing, and queues their images for mirroring.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">WordPress Image Mirror</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm flex-wrap">
                    <span>Pending: <strong>{mediaStats.pending}</strong></span>
                    <span className="text-green-600">Done: <strong>{mediaStats.done}</strong></span>
                    <span className="text-destructive">Errors: <strong>{mediaStats.error}</strong></span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={runMirror} disabled={mirroring}>
                      {mirroring ? "Mirroring..." : mediaStats.pending === 0 ? "Run mirror (nothing pending)" : `Mirror next 50 images`}
                    </Button>
                    <Button variant="outline" onClick={retryErrored} disabled={retrying || mediaStats.error === 0}>
                      {retrying ? "Requeuing..." : `Retry ${mediaStats.error} errored`}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Downloads original afriwedd.com images, re-hosts to Cloud storage, and rewrites posts. Retry sends errored assets back to the queue.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          )}

          <Dialog open={storyEditorOpen} onOpenChange={setStoryEditorOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit story</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={storyForm.title} onChange={(event) => setStoryForm({ ...storyForm, title: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>URL slug</Label>
                    <Input value={storyForm.slug} onChange={(event) => setStoryForm({ ...storyForm, slug: slugify(event.target.value) })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Featured image</Label>
                  <StoryImageInput value={storyForm.featured_image_url} onChange={(url) => setStoryForm({ ...storyForm, featured_image_url: url })} />
                </div>

                <div className="space-y-2">
                  <Label>Excerpt</Label>
                  <Textarea value={storyForm.excerpt} onChange={(event) => setStoryForm({ ...storyForm, excerpt: event.target.value })} rows={2} />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <RichTextEditor key={editingStory?.id || "admin-story"} value={storyForm.content_html} onChange={(html) => setStoryForm((current) => ({ ...current, content_html: html }))} />
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={storyForm.language} onValueChange={(value) => setStoryForm({ ...storyForm, language: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="rw">Kinyarwanda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={storyForm.status} onValueChange={(value) => setStoryForm({ ...storyForm, status: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="publish">Published</SelectItem>
                        <SelectItem value="draft">Hidden / Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStoryEditorOpen(false)}>Cancel</Button>
                  <Button onClick={saveStory} disabled={storySaving}>{storySaving ? "Saving..." : "Save story"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  );
};

export default AdminDashboard;
