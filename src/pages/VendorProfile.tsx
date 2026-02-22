import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Star, MapPin, MessageCircle, Calendar, Check, Clock, Users, CreditCard, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const defaultImages: Record<string, string> = {
  venues: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=500&fit=crop",
  photographers: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&h=500&fit=crop",
  catering: "https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&h=500&fit=crop",
  decorators: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=1200&h=500&fit=crop",
  makeup_artists: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&h=500&fit=crop",
  sound_lighting: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=500&fit=crop",
  car_hire: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=1200&h=500&fit=crop",
  mc_entertainment: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=500&fit=crop",
  videographers: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&h=500&fit=crop",
  wedding_planners: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=500&fit=crop",
};

const categoryLabels: Record<string, string> = {
  venues: "Venues", photographers: "Photographers", videographers: "Videographers",
  decorators: "Decorators", catering: "Catering", makeup_artists: "Makeup Artists",
  mc_entertainment: "MC & Entertainment", car_hire: "Car Hire",
  sound_lighting: "Sound & Lighting", wedding_planners: "Wedding Planners",
};

const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [dateUnavailable, setDateUnavailable] = useState(false);

  // Payment state
  const [paymentStep, setPaymentStep] = useState<"booking" | "payment" | "confirmation">("booking");
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "airtel" | "card">("momo");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchVendor = async () => {
      const [vRes, sRes, mRes] = await Promise.all([
        supabase.from("vendors").select("*").eq("id", id).maybeSingle(),
        supabase.from("vendor_services").select("*").eq("vendor_id", id).order("price"),
        supabase.from("vendor_media").select("*").eq("vendor_id", id).order("created_at", { ascending: false }),
      ]);
      // Use security definer function for booked dates
      const { data: dates } = await supabase.rpc("get_vendor_booked_dates", { _vendor_id: id });
      setVendor(vRes.data);
      setServices(sRes.data ?? []);
      setMedia(mRes.data ?? []);
      setBookedDates((dates ?? []).map((d: any) => typeof d === "string" ? d : d));
      setLoading(false);
      if (sRes.data?.length) setSelectedService(sRes.data[0]);
    };
    fetchVendor();
  }, [id]);

  useEffect(() => {
    if (!bookingDate) { setDateUnavailable(false); return; }
    setDateUnavailable(bookedDates.includes(bookingDate));
  }, [bookingDate, bookedDates]);

  const totalAmount = selectedService?.price || 0;
  const depositAmount = Math.round(totalAmount * 0.6);

  const handlePayment = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to book.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!bookingDate) {
      toast({ title: "Select a date", variant: "destructive" });
      return;
    }
    if (dateUnavailable) {
      toast({ title: "Date unavailable", variant: "destructive" });
      return;
    }
    if (paymentMethod !== "card" && !paymentPhone) {
      toast({ title: "Enter your phone number", variant: "destructive" });
      return;
    }

    setProcessingPayment(true);

    // 1. Create booking with payment_status = 'paid'
    const { data: booking, error: bookingError } = await supabase.from("bookings").insert({
      vendor_id: id!,
      client_id: user.id,
      event_date: bookingDate,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      notes: bookingNotes || `${selectedService?.name || "Service"} booking`,
      service_id: selectedService?.id || null,
      payment_status: "paid",
    }).select().single();

    if (bookingError) {
      toast({ title: "Booking failed", description: bookingError.message, variant: "destructive" });
      setProcessingPayment(false);
      return;
    }

    // 2. Create transaction record (money goes to admin wallet)
    const commission = Math.round(depositAmount * 0.1); // 10% commission
    await supabase.from("transactions").insert({
      booking_id: booking.id,
      vendor_id: id!,
      client_id: user.id,
      amount: depositAmount,
      commission,
      payment_method: paymentMethod === "airtel" ? "airtel" : paymentMethod === "card" ? "card" : "momo",
      status: "completed",
    });

    setProcessingPayment(false);
    setPaymentStep("confirmation");
  };

  const resetBooking = () => {
    setBookingOpen(false);
    setPaymentStep("booking");
    setBookingDate("");
    setBookingNotes("");
    setPaymentPhone("");
  };

  const startChat = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!vendor) return;

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
        if (convo && parts?.length === 2 && parts.some(p => p.user_id === vendor.user_id)) {
          navigate("/messages");
          return;
        }
      }
    }

    const { data: convo } = await supabase
      .from("conversations")
      .insert({ name: vendor.business_name, is_group: false, created_by: user.id })
      .select()
      .single();
    if (!convo) return;
    await supabase.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: vendor.user_id },
    ]);
    navigate("/messages");
  };

  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="text-muted-foreground">Loading vendor...</p>
      </div>
    </>
  );

  if (!vendor) return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 gap-4">
        <h2 className="font-display text-2xl font-bold text-foreground">Vendor Not Found</h2>
        <Button onClick={() => navigate("/vendors")}>Browse Vendors</Button>
      </div>
    </>
  );

  const coverImage = vendor.cover_image_url || defaultImages[vendor.category] || defaultImages.venues;
  const galleryImages = media.filter(m => m.media_type === "image");

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Cover */}
        <div className="relative h-64 md:h-80">
          <img src={coverImage} alt={vendor.business_name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            className="relative -mt-16 bg-card rounded-xl shadow-card p-6 md:p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {categoryLabels[vendor.category] || vendor.category}
                  </span>
                  {vendor.is_verified && (
                    <Badge className="bg-primary text-primary-foreground text-xs"><Check className="w-3 h-3 mr-1" />Verified</Badge>
                  )}
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{vendor.business_name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {vendor.location || "Rwanda"}</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-gold fill-gold" /> {vendor.rating || 0} ({vendor.review_count || 0} reviews)
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-full gap-2" onClick={startChat}>
                  <MessageCircle className="w-4 h-4" /> Chat Now
                </Button>
                <Dialog open={bookingOpen} onOpenChange={(open) => { if (!open) resetBooking(); else setBookingOpen(true); }}>
                  <DialogTrigger asChild>
                    <Button variant="hero" className="rounded-full gap-2">
                      <Calendar className="w-4 h-4" /> Book Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {paymentStep === "booking" && `Book ${vendor.business_name}`}
                        {paymentStep === "payment" && "Complete Payment"}
                        {paymentStep === "confirmation" && "Booking Confirmed! 🎉"}
                      </DialogTitle>
                    </DialogHeader>

                    {/* Step 1: Booking Details */}
                    {paymentStep === "booking" && (
                      <div className="space-y-4">
                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-foreground">💰 60% Upfront Payment Required</p>
                          <p className="text-xs text-muted-foreground mt-1">You must pay 60% of the total amount to confirm your booking. The remaining 40% is due on the event day.</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Event Date</Label>
                          <Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                          {dateUnavailable && (
                            <p className="text-sm text-destructive font-medium">⚠️ This vendor is already booked on this date.</p>
                          )}
                        </div>
                        {services.length > 0 && (
                          <div className="space-y-2">
                            <Label>Package</Label>
                            <div className="space-y-2">
                              {services.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => setSelectedService(s)}
                                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                                    selectedService?.id === s.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                                  }`}
                                >
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                                    {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                                  </div>
                                  <p className="text-sm font-semibold text-primary">{(s.price || 0).toLocaleString()} RWF</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Notes (optional)</Label>
                          <Textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Any special requests..." rows={2} />
                        </div>
                        {selectedService && (
                          <div className="bg-muted rounded-lg p-3 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Amount</span>
                              <span className="font-medium text-foreground">{totalAmount.toLocaleString()} RWF</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold">
                              <span className="text-primary">Pay Now (60%)</span>
                              <span className="text-primary">{depositAmount.toLocaleString()} RWF</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Due on event day (40%)</span>
                              <span className="text-muted-foreground">{(totalAmount - depositAmount).toLocaleString()} RWF</span>
                            </div>
                          </div>
                        )}
                        <Button onClick={() => setPaymentStep("payment")} className="w-full" disabled={!bookingDate || dateUnavailable || !selectedService}>
                          Proceed to Payment
                        </Button>
                      </div>
                    )}

                    {/* Step 2: Payment */}
                    {paymentStep === "payment" && (
                      <div className="space-y-4">
                        <div className="bg-muted rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Amount to Pay</p>
                          <p className="text-2xl font-bold text-primary">{depositAmount.toLocaleString()} RWF</p>
                          <p className="text-xs text-muted-foreground">60% deposit for {selectedService?.name}</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "momo" as const, label: "MTN MoMo", icon: Smartphone, color: "bg-yellow-500" },
                              { id: "airtel" as const, label: "Airtel Money", icon: Smartphone, color: "bg-red-500" },
                              { id: "card" as const, label: "Card", icon: CreditCard, color: "bg-blue-500" },
                            ].map(m => (
                              <button
                                key={m.id}
                                onClick={() => setPaymentMethod(m.id)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${
                                  paymentMethod === m.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                <m.icon className="w-5 h-5" />
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {paymentMethod !== "card" && (
                          <div className="space-y-2">
                            <Label>{paymentMethod === "momo" ? "MTN MoMo Number" : "Airtel Money Number"}</Label>
                            <Input
                              type="tel"
                              value={paymentPhone}
                              onChange={e => setPaymentPhone(e.target.value)}
                              placeholder={paymentMethod === "momo" ? "078XXXXXXX" : "073XXXXXXX"}
                            />
                          </div>
                        )}

                        {paymentMethod === "card" && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Card Number</Label>
                              <Input placeholder="4242 4242 4242 4242" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Expiry</Label>
                                <Input placeholder="MM/YY" />
                              </div>
                              <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input placeholder="123" />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1" onClick={() => setPaymentStep("booking")}>Back</Button>
                          <Button className="flex-1" onClick={handlePayment} disabled={processingPayment}>
                            {processingPayment ? "Processing..." : `Pay ${depositAmount.toLocaleString()} RWF`}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          All payments are securely processed. Funds are held by the platform until event completion.
                        </p>
                      </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {paymentStep === "confirmation" && (
                      <div className="space-y-4 text-center py-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Check className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Payment Successful!</h3>
                          <p className="text-sm text-muted-foreground mt-1">Your booking has been submitted and payment of <strong>{depositAmount.toLocaleString()} RWF</strong> received.</p>
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-left space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Vendor</span><span className="font-medium text-foreground">{vendor.business_name}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{bookingDate}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium text-foreground">{selectedService?.name}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-primary">{depositAmount.toLocaleString()} RWF</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-medium text-foreground">{(totalAmount - depositAmount).toLocaleString()} RWF</span></div>
                        </div>
                        <p className="text-xs text-muted-foreground">The vendor will review and confirm your booking. You'll be notified once confirmed.</p>
                        <Button onClick={resetBooking} className="w-full">Done</Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 pb-16">
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed">{vendor.description || "No description provided yet."}</p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[
                    { icon: Clock, label: "Response Time", value: "< 2 hours" },
                    { icon: Users, label: "Bookings", value: `${vendor.review_count || 0}+` },
                    { icon: Check, label: "Status", value: vendor.is_verified ? "Verified" : "Active" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-muted p-4 rounded-lg text-center">
                      <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Packages */}
              {services.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4">Packages & Pricing</h2>
                  <div className="space-y-4">
                    {services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                        <div>
                          <h3 className="font-semibold text-foreground">{s.name}</h3>
                          <p className="text-sm text-muted-foreground">{s.description}</p>
                          {s.duration && <p className="text-xs text-muted-foreground mt-1">{s.duration}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-primary">{(s.price || 0).toLocaleString()} RWF</p>
                          <p className="text-xs text-muted-foreground">60% deposit: {Math.round((s.price || 0) * 0.6).toLocaleString()} RWF</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 rounded-full text-xs"
                            onClick={() => { setSelectedService(s); setBookingOpen(true); }}
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Gallery */}
              {galleryImages.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {galleryImages.map((m) => (
                      <div key={m.id} className="aspect-[4/3] rounded-lg overflow-hidden">
                        <img src={m.url} alt={m.caption || "Gallery"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sticky sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
                <h3 className="font-display text-lg font-semibold text-foreground">Quick Actions</h3>
                <Button className="w-full rounded-full gap-2" variant="outline" onClick={startChat}>
                  <MessageCircle className="w-4 h-4" /> Chat Now
                </Button>
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">Quick Booking</h4>
                  <div className="space-y-3">
                    <Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                    {dateUnavailable && (
                      <p className="text-sm text-destructive font-medium">⚠️ Already booked on this date</p>
                    )}
                    {services.length > 0 && (
                      <select
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                        value={selectedService?.id || ""}
                        onChange={e => setSelectedService(services.find(s => s.id === e.target.value) || null)}
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} – {(s.price || 0).toLocaleString()} RWF</option>
                        ))}
                      </select>
                    )}
                    {selectedService && (
                      <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                        <p>Deposit (60%): <strong className="text-primary">{Math.round((selectedService.price || 0) * 0.6).toLocaleString()} RWF</strong></p>
                      </div>
                    )}
                    <Button className="w-full rounded-full" variant="hero" onClick={() => setBookingOpen(true)} disabled={dateUnavailable}>
                      {dateUnavailable ? "Date Unavailable" : "Book & Pay"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">60% upfront payment required</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default VendorProfile;
