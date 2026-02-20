import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Users, Store, DollarSign, TrendingUp, CheckCircle, XCircle,
  ShieldCheck, Star, Eye, AlertTriangle, Megaphone, Trash2, Image as ImageIcon
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);

  // New ad form
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adVendorId, setAdVendorId] = useState("");
  const [adMediaUrl, setAdMediaUrl] = useState("");
  const [adMediaType, setAdMediaType] = useState("image");
  const [uploading, setUploading] = useState(false);
  const adFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    const [vRes, tRes, bRes, pRes, aRes] = await Promise.all([
      supabase.from("vendors").select("*").order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("advertisements").select("*").order("created_at", { ascending: false }),
    ]);
    setVendors(vRes.data ?? []);
    setTransactions(tRes.data ?? []);
    setBookings(bRes.data ?? []);
    setProfiles(pRes.data ?? []);
    setAds(aRes.data ?? []);
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
    setAdMediaUrl(publicUrl.publicUrl);
    setAdMediaType(file.type.startsWith("video") ? "video" : "image");
    setUploading(false);
  };

  const publishAd = async () => {
    if (!adTitle || !adMediaUrl) {
      toast({ title: "Title and media are required", variant: "destructive" });
      return;
    }
    await supabase.from("advertisements").insert({
      title: adTitle,
      description: adDescription,
      media_url: adMediaUrl,
      media_type: adMediaType,
      vendor_id: adVendorId || null,
      is_active: true,
    });
    setAdTitle(""); setAdDescription(""); setAdMediaUrl(""); setAdVendorId("");
    toast({ title: "Advertisement published!" });
    fetchAll();
  };

  const toggleAdActive = async (id: string, active: boolean) => {
    await supabase.from("advertisements").update({ is_active: active }).eq("id", id);
    toast({ title: active ? "Ad activated" : "Ad deactivated" });
    fetchAll();
  };

  const deleteAd = async (id: string) => {
    await supabase.from("advertisements").delete().eq("id", id);
    toast({ title: "Ad deleted" });
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
  const pendingVendors = vendors.filter(v => !v.is_approved).length;

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Platform overview and management</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Platform Revenue</p><p className="text-xl font-bold text-foreground">{totalRevenue.toLocaleString()} RWF</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Store className="w-8 h-8 text-accent" /><div><p className="text-xs text-muted-foreground">Total Vendors</p><p className="text-xl font-bold text-foreground">{vendors.length}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total Users</p><p className="text-xl font-bold text-foreground">{profiles.length}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-destructive" /><div><p className="text-xs text-muted-foreground">Pending Approvals</p><p className="text-xl font-bold text-foreground">{pendingVendors}</p></div></div></CardContent></Card>
          </div>

          <Tabs defaultValue="vendors" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="ads">Advertisements</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

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
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" />Publish Advertisement</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Ad Title</Label>
                      <Input value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="e.g. Featured Photographer" />
                    </div>
                    <div className="space-y-2">
                      <Label>Link to Vendor (optional)</Label>
                      <Select value={adVendorId} onValueChange={setAdVendorId}>
                        <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {vendors.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.business_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={adDescription} onChange={e => setAdDescription(e.target.value)} placeholder="Short ad description..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Media (Image or Video)</Label>
                    <input ref={adFileRef} type="file" accept="image/*,video/*" hidden onChange={handleAdUpload} />
                    <div className="flex gap-3 items-center">
                      <Button variant="outline" onClick={() => adFileRef.current?.click()} disabled={uploading}>
                        <ImageIcon className="w-4 h-4 mr-2" />{uploading ? "Uploading..." : "Upload Media"}
                      </Button>
                      {adMediaUrl && (
                        <Badge variant="secondary">✓ Media ready</Badge>
                      )}
                    </div>
                    {adMediaUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
                        {adMediaType === "video" ? (
                          <video src={adMediaUrl} className="w-full h-32 object-cover" controls />
                        ) : (
                          <img src={adMediaUrl} alt="Preview" className="w-full h-32 object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                  <Button onClick={publishAd} disabled={!adTitle || !adMediaUrl}>
                    <Megaphone className="w-4 h-4 mr-2" />Publish Ad
                  </Button>
                </CardContent>
              </Card>

              {/* Existing ads */}
              <Card className="mt-6">
                <CardHeader><CardTitle className="text-lg">Active Advertisements ({ads.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ads.map(ad => (
                      <div key={ad.id} className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
                            {ad.media_type === "video" ? (
                              <video src={ad.media_url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={ad.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{ad.title}</p>
                            <p className="text-xs text-muted-foreground">{ad.description}</p>
                            <Badge variant={ad.is_active ? "default" : "secondary"} className="text-xs mt-1">
                              {ad.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => toggleAdActive(ad.id, !ad.is_active)}>
                            {ad.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAd(ad.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {ads.length === 0 && <p className="text-center py-8 text-muted-foreground">No advertisements yet</p>}
                  </div>
                </CardContent>
              </Card>
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
                          <Badge variant={b.status === "confirmed" ? "default" : b.status === "pending" ? "secondary" : "destructive"}>{b.status}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">Event: {new Date(b.event_date).toLocaleDateString()}</p>
                        </div>
                        <p className="font-semibold text-foreground">{(b.total_amount || 0).toLocaleString()} RWF</p>
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
                    {profiles.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        {p.avatar_url ? <img src={p.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : <Users className="w-10 h-10 p-2 bg-background rounded-full text-muted-foreground" />}
                        <div>
                          <p className="font-medium text-foreground">{p.full_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default AdminDashboard;
