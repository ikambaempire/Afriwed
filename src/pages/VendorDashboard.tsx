import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Upload, Image as ImageIcon, Video, DollarSign, Calendar,
  CheckCircle, XCircle, Clock, TrendingUp, Eye, Package
} from "lucide-react";

const VendorDashboard = () => {
  const { user, loading, isVendor, vendorId } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // New service form
  const [newService, setNewService] = useState({ name: "", description: "", price: "", duration: "" });

  useEffect(() => {
    if (vendorId) fetchAll();
  }, [vendorId]);

  const fetchAll = async () => {
    const [vRes, sRes, mRes, bRes, tRes] = await Promise.all([
      supabase.from("vendors").select("*").eq("id", vendorId).single(),
      supabase.from("vendor_services").select("*").eq("vendor_id", vendorId),
      supabase.from("vendor_media").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
    ]);
    setVendor(vRes.data);
    setServices(sRes.data ?? []);
    setMedia(mRes.data ?? []);
    setBookings(bRes.data ?? []);
    setTransactions(tRes.data ?? []);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "video") => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("vendor-media").upload(path, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        continue;
      }
      const { data: publicUrl } = supabase.storage.from("vendor-media").getPublicUrl(path);
      await supabase.from("vendor_media").insert({
        vendor_id: vendorId,
        url: publicUrl.publicUrl,
        media_type: mediaType,
      });
    }
    setUploading(false);
    toast({ title: `${mediaType === "image" ? "Images" : "Videos"} uploaded!` });
    fetchAll();
  };

  const addService = async () => {
    if (!newService.name || !newService.price) return;
    await supabase.from("vendor_services").insert({
      vendor_id: vendorId,
      name: newService.name,
      description: newService.description,
      price: parseInt(newService.price),
      duration: newService.duration,
    });
    setNewService({ name: "", description: "", price: "", duration: "" });
    toast({ title: "Service added!" });
    fetchAll();
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    toast({ title: `Booking ${status}` });
    fetchAll();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isVendor) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h2 className="font-display text-2xl font-bold text-foreground">Vendor Access Only</h2>
      <p className="text-muted-foreground text-center">Your account is not registered as a vendor.</p>
      <Button onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );

  const totalEarnings = transactions.filter(t => t.status === "completed").reduce((s, t) => s + (t.amount - t.commission), 0);
  const pendingBookings = bookings.filter(b => b.status === "pending").length;

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {vendor?.business_name || "Vendor Dashboard"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Manage your services, media, and bookings</p>
            </div>
            <div className="flex gap-2">
              {vendor?.is_verified && <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>}
              {vendor?.is_approved ? (
                <Badge variant="outline" className="border-primary text-primary">Approved</Badge>
              ) : (
                <Badge variant="outline" className="border-accent text-accent">Pending Approval</Badge>
              )}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total Earnings</p><p className="text-xl font-bold text-foreground">{totalEarnings.toLocaleString()} RWF</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-accent" /><div><p className="text-xs text-muted-foreground">Pending Bookings</p><p className="text-xl font-bold text-foreground">{pendingBookings}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Package className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Services</p><p className="text-xl font-bold text-foreground">{services.length}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ImageIcon className="w-8 h-8 text-accent" /><div><p className="text-xs text-muted-foreground">Media Files</p><p className="text-xl font-bold text-foreground">{media.length}</p></div></div></CardContent></Card>
          </div>

          <Tabs defaultValue="media" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>

            {/* Media Tab */}
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Media</CardTitle>
                  <CardDescription>Add photos and videos of your work to attract clients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-3 flex-wrap">
                    <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={e => handleFileUpload(e, "image")} />
                    <input ref={videoInputRef} type="file" accept="video/*" multiple hidden onChange={e => handleFileUpload(e, "video")} />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline">
                      <ImageIcon className="w-4 h-4 mr-2" />Upload Images
                    </Button>
                    <Button onClick={() => videoInputRef.current?.click()} disabled={uploading} variant="outline">
                      <Video className="w-4 h-4 mr-2" />Upload Videos
                    </Button>
                  </div>
                  {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {media.map((m) => (
                      <div key={m.id} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                        {m.media_type === "video" ? (
                          <video src={m.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                        <Badge className="absolute top-2 left-2 text-xs">{m.media_type}</Badge>
                      </div>
                    ))}
                    {media.length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Upload className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No media yet. Upload images or videos of your work!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Services & Packages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Service Name</Label>
                      <Input value={newService.name} onChange={e => setNewService(s => ({...s, name: e.target.value}))} placeholder="e.g. Gold Package" />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (RWF)</Label>
                      <Input type="number" value={newService.price} onChange={e => setNewService(s => ({...s, price: e.target.value}))} placeholder="500000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input value={newService.duration} onChange={e => setNewService(s => ({...s, duration: e.target.value}))} placeholder="e.g. Full Day" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={newService.description} onChange={e => setNewService(s => ({...s, description: e.target.value}))} placeholder="Describe the service..." rows={1} />
                    </div>
                  </div>
                  <Button onClick={addService}>Add Service</Button>
                  <div className="space-y-3 mt-4">
                    {services.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.description}</p>
                          {s.duration && <p className="text-xs text-muted-foreground">{s.duration}</p>}
                        </div>
                        <p className="font-semibold text-primary">{(s.price || 0).toLocaleString()} RWF</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No bookings yet</p>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map(b => (
                        <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted rounded-lg">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={b.status === "confirmed" ? "default" : b.status === "pending" ? "secondary" : "destructive"}>
                                {b.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{new Date(b.event_date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-foreground">{(b.total_amount || 0).toLocaleString()} RWF</p>
                            {b.notes && <p className="text-xs text-muted-foreground mt-1">{b.notes}</p>}
                          </div>
                          {b.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateBookingStatus(b.id, "confirmed")}>
                                <CheckCircle className="w-3 h-3 mr-1" />Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, "rejected")}>
                                <XCircle className="w-3 h-3 mr-1" />Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Earnings & Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                            <Badge variant={t.status === "completed" ? "default" : "secondary"}>{t.status}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">{t.payment_method.toUpperCase()} • {new Date(t.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{(t.amount || 0).toLocaleString()} RWF</p>
                            <p className="text-xs text-muted-foreground">Commission: {(t.commission || 0).toLocaleString()} RWF</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default VendorDashboard;
