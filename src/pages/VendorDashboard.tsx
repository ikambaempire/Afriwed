import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import BookingCalendar from "@/components/vendor/BookingCalendar";
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
  CheckCircle, XCircle, Clock, TrendingUp, Eye, Package, Pencil, Trash2,
  Wallet, ArrowUpRight, Smartphone, Building2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

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

  const [newService, setNewService] = useState({ name: "", description: "", price: "", duration: "" });
  const [editingService, setEditingService] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "", duration: "" });

  // Payment details
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ payment_method: "momo", account_name: "", account_number: "", bank_name: "" });

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (vendorId) fetchAll();
  }, [vendorId]);

  const fetchAll = async () => {
    const [vRes, sRes, mRes, bRes, tRes, pdRes, wRes] = await Promise.all([
      supabase.from("vendors").select("*").eq("id", vendorId).single(),
      supabase.from("vendor_services").select("*").eq("vendor_id", vendorId),
      supabase.from("vendor_media").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("vendor_payment_details").select("*").eq("vendor_id", vendorId).maybeSingle(),
      supabase.from("withdrawal_requests").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
    ]);
    setVendor(vRes.data);
    setServices(sRes.data ?? []);
    setMedia(mRes.data ?? []);
    setBookings(bRes.data ?? []);
    setTransactions(tRes.data ?? []);
    setPaymentDetails(pdRes.data);
    if (pdRes.data) {
      setPaymentForm({
        payment_method: pdRes.data.payment_method,
        account_name: pdRes.data.account_name,
        account_number: pdRes.data.account_number,
        bank_name: pdRes.data.bank_name || "",
      });
    }
    setWithdrawals(wRes.data ?? []);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "video") => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("vendor-media").upload(path, file);
      if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); continue; }
      const { data: publicUrl } = supabase.storage.from("vendor-media").getPublicUrl(path);
      await supabase.from("vendor_media").insert({ vendor_id: vendorId, url: publicUrl.publicUrl, media_type: mediaType });
    }
    setUploading(false);
    toast({ title: `${mediaType === "image" ? "Images" : "Videos"} uploaded!` });
    fetchAll();
  };

  const addService = async () => {
    if (!newService.name || !newService.price) return;
    await supabase.from("vendor_services").insert({
      vendor_id: vendorId, name: newService.name, description: newService.description,
      price: parseInt(newService.price), duration: newService.duration,
    });
    setNewService({ name: "", description: "", price: "", duration: "" });
    toast({ title: "Service added!" });
    fetchAll();
  };

  const updateService = async () => {
    if (!editingService || !editForm.name || !editForm.price) return;
    await supabase.from("vendor_services").update({
      name: editForm.name, description: editForm.description,
      price: parseInt(editForm.price), duration: editForm.duration,
    }).eq("id", editingService.id);
    setEditingService(null);
    toast({ title: "Service updated!" });
    fetchAll();
  };

  const deleteService = async (id: string) => {
    await supabase.from("vendor_services").delete().eq("id", id);
    toast({ title: "Service deleted" });
    fetchAll();
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    toast({ title: `Booking ${status}` });
    fetchAll();
  };

  const savePaymentDetails = async () => {
    if (!paymentForm.account_name || !paymentForm.account_number) {
      toast({ title: "Account name and number are required", variant: "destructive" });
      return;
    }
    if (paymentDetails) {
      await supabase.from("vendor_payment_details").update({
        payment_method: paymentForm.payment_method,
        account_name: paymentForm.account_name,
        account_number: paymentForm.account_number,
        bank_name: paymentForm.bank_name || null,
      }).eq("vendor_id", vendorId);
    } else {
      await supabase.from("vendor_payment_details").insert({
        vendor_id: vendorId,
        payment_method: paymentForm.payment_method,
        account_name: paymentForm.account_name,
        account_number: paymentForm.account_number,
        bank_name: paymentForm.bank_name || null,
      });
    }
    toast({ title: "Payment details saved!" });
    fetchAll();
  };

  const requestWithdrawal = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (amount > availableBalance) {
      toast({ title: "Insufficient balance", description: `Your available balance is ${availableBalance.toLocaleString()} RWF`, variant: "destructive" });
      return;
    }
    if (!paymentDetails) {
      toast({ title: "Add payment details first", description: "Go to the Payment tab to add your MoMo or bank details.", variant: "destructive" });
      return;
    }
    const commission = Math.round(amount * 0.1);
    await supabase.from("withdrawal_requests").insert({
      vendor_id: vendorId,
      amount,
      commission,
      net_amount: amount - commission,
      status: "pending",
    });
    setWithdrawAmount("");
    toast({ title: "Withdrawal requested!", description: "Admin will process your request shortly." });
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
  const totalWithdrawn = withdrawals.filter(w => w.status === "completed").reduce((s, w) => s + w.net_amount, 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + w.net_amount, 0);
  const availableBalance = totalEarnings - totalWithdrawn - pendingWithdrawals;
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
              <p className="text-muted-foreground text-sm mt-1">Manage your services, media, bookings & payments</p>
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

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Wallet className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Available Balance</p><p className="text-xl font-bold text-foreground">{availableBalance.toLocaleString()} RWF</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total Earned</p><p className="text-xl font-bold text-foreground">{totalEarnings.toLocaleString()} RWF</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-accent" /><div><p className="text-xs text-muted-foreground">Pending Bookings</p><p className="text-xl font-bold text-foreground">{pendingBookings}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Package className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Services</p><p className="text-xl font-bold text-foreground">{services.length}</p></div></div></CardContent></Card>
          </div>

          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar"><BookingCalendar bookings={bookings} /></TabsContent>

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
                    <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline"><ImageIcon className="w-4 h-4 mr-2" />Upload Images</Button>
                    <Button onClick={() => videoInputRef.current?.click()} disabled={uploading} variant="outline"><Video className="w-4 h-4 mr-2" />Upload Videos</Button>
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
                <CardHeader><CardTitle className="text-lg">Your Services & Packages</CardTitle></CardHeader>
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
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-primary">{(s.price || 0).toLocaleString()} RWF</p>
                          <Button size="icon" variant="ghost" onClick={() => {
                            setEditingService(s);
                            setEditForm({ name: s.name, description: s.description || "", price: String(s.price), duration: s.duration || "" });
                          }}><Pencil className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteService(s.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (RWF)</Label>
                      <Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({...f, price: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input value={editForm.duration} onChange={e => setEditForm(f => ({...f, duration: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={editForm.description} onChange={e => setEditForm(f => ({...f, description: e.target.value}))} rows={3} />
                    </div>
                    <Button onClick={updateService} className="w-full">Save Changes</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader><CardTitle className="text-lg">Booking Requests</CardTitle></CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No bookings yet</p>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map(b => (
                        <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted rounded-lg">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={b.status === "confirmed" ? "default" : b.status === "pending" ? "secondary" : "destructive"}>{b.status}</Badge>
                              <Badge variant={b.payment_status === "paid" ? "default" : "outline"} className="text-xs">
                                {b.payment_status === "paid" ? "💰 Paid" : "Unpaid"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{new Date(b.event_date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-foreground">{(b.total_amount || 0).toLocaleString()} RWF (Deposit: {(b.deposit_amount || 0).toLocaleString()} RWF)</p>
                            {b.notes && <p className="text-xs text-muted-foreground mt-1">{b.notes}</p>}
                          </div>
                          {b.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateBookingStatus(b.id, "confirmed")} disabled={b.payment_status !== "paid"}>
                                <CheckCircle className="w-3 h-3 mr-1" />{b.payment_status === "paid" ? "Accept" : "Awaiting Payment"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, "rejected")}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Payment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" />Payment Details</CardTitle>
                    <CardDescription>Add your payment details so you can receive withdrawals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "momo", label: "MTN MoMo", icon: Smartphone },
                          { id: "airtel", label: "Airtel Money", icon: Smartphone },
                          { id: "bank", label: "Bank Transfer", icon: Building2 },
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => setPaymentForm(f => ({...f, payment_method: m.id}))}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${
                              paymentForm.payment_method === m.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <m.icon className="w-5 h-5" />
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input value={paymentForm.account_name} onChange={e => setPaymentForm(f => ({...f, account_name: e.target.value}))} placeholder="Full name on account" />
                    </div>
                    <div className="space-y-2">
                      <Label>{paymentForm.payment_method === "bank" ? "Account Number" : "Phone Number"}</Label>
                      <Input value={paymentForm.account_number} onChange={e => setPaymentForm(f => ({...f, account_number: e.target.value}))} placeholder={paymentForm.payment_method === "bank" ? "Account number" : "078XXXXXXX"} />
                    </div>
                    {paymentForm.payment_method === "bank" && (
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input value={paymentForm.bank_name} onChange={e => setPaymentForm(f => ({...f, bank_name: e.target.value}))} placeholder="e.g. Bank of Kigali" />
                      </div>
                    )}
                    <Button onClick={savePaymentDetails} className="w-full">
                      {paymentDetails ? "Update Payment Details" : "Save Payment Details"}
                    </Button>
                    {paymentDetails && (
                      <p className="text-xs text-muted-foreground text-center">✓ Payment details configured</p>
                    )}
                  </CardContent>
                </Card>

                {/* Request Withdrawal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-primary" />Request Withdrawal</CardTitle>
                    <CardDescription>Request a withdrawal from your available balance. Admin will process it minus 10% commission.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Earned</span>
                        <span className="font-medium text-foreground">{totalEarnings.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Withdrawn</span>
                        <span className="font-medium text-foreground">{totalWithdrawn.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending Withdrawals</span>
                        <span className="font-medium text-accent">{pendingWithdrawals.toLocaleString()} RWF</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                        <span className="text-primary">Available Balance</span>
                        <span className="text-primary">{availableBalance.toLocaleString()} RWF</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (RWF)</Label>
                      <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Enter amount" />
                      {withdrawAmount && parseInt(withdrawAmount) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Commission (10%): {Math.round(parseInt(withdrawAmount) * 0.1).toLocaleString()} RWF • 
                          You'll receive: {(parseInt(withdrawAmount) - Math.round(parseInt(withdrawAmount) * 0.1)).toLocaleString()} RWF
                        </p>
                      )}
                    </div>
                    <Button onClick={requestWithdrawal} className="w-full" disabled={!paymentDetails}>
                      {paymentDetails ? "Request Withdrawal" : "Add Payment Details First"}
                    </Button>

                    {/* Withdrawal History */}
                    {withdrawals.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-medium text-foreground">Withdrawal History</h4>
                        {withdrawals.map(w => (
                          <div key={w.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                            <div>
                              <Badge variant={w.status === "completed" ? "default" : w.status === "pending" ? "secondary" : "destructive"} className="text-xs">{w.status}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(w.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{(w.net_amount || 0).toLocaleString()} RWF</p>
                              <p className="text-xs text-muted-foreground">Fee: {(w.commission || 0).toLocaleString()} RWF</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings">
              <Card>
                <CardHeader><CardTitle className="text-lg">Earnings & Transactions</CardTitle></CardHeader>
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
