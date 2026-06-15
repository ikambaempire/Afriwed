import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Submit = () => {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const initial = params.get("type") === "vendor" ? "vendor" : "wedding";
  const [type, setType] = useState<"wedding" | "vendor">(initial as any);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>({});

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to submit"); nav("/auth"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("submissions").insert({
      submission_type: type,
      submitter_id: user.id,
      submitter_email: user.email,
      submitter_name: form.contact_name || user.email,
      payload: form,
      status: "pending",
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Submission received! Our team will review and get back to you."); setForm({}); }
  };

  return (
    <>
      <Helmet>
        <title>Submit Your Story or Business — Afriwedd</title>
        <meta name="description" content="Share your real wedding story or list your wedding business with Afriwedd." />
        <link rel="canonical" href="/submit" />
      </Helmet>
      <Header />
      <main className="pt-24 pb-20 bg-background min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-2 text-center">Submit</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">Share Your Story With Afriwedd</h1>
          <p className="text-muted-foreground text-center mb-10">Tell us about your wedding, or list your vendor business. Our team reviews every submission.</p>

          <div className="flex gap-2 justify-center mb-8">
            <button onClick={() => setType("wedding")} className={`px-5 py-2 rounded-full text-sm font-medium ${type === "wedding" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Real Wedding</button>
            <button onClick={() => setType("vendor")} className={`px-5 py-2 rounded-full text-sm font-medium ${type === "vendor" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Vendor Listing</button>
          </div>

          <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-card">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Your name *</Label>
                <Input required value={form.contact_name || ""} onChange={e => set("contact_name", e.target.value)} />
              </div>
              <div>
                <Label>Contact email *</Label>
                <Input required type="email" value={form.contact_email || user?.email || ""} onChange={e => set("contact_email", e.target.value)} />
              </div>
            </div>

            {type === "wedding" ? (
              <>
                <div>
                  <Label>Couple names *</Label>
                  <Input required placeholder="e.g. Diane & Richard" value={form.couple_names || ""} onChange={e => set("couple_names", e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Wedding date</Label>
                    <Input type="date" value={form.wedding_date || ""} onChange={e => set("wedding_date", e.target.value)} />
                  </div>
                  <div>
                    <Label>Location (city)</Label>
                    <Input value={form.location || ""} onChange={e => set("location", e.target.value)} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Country</Label>
                    <Input placeholder="Rwanda" value={form.country || ""} onChange={e => set("country", e.target.value)} />
                  </div>
                  <div>
                    <Label>Wedding type</Label>
                    <Select value={form.wedding_type || ""} onValueChange={v => set("wedding_type", v)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="traditional">Traditional</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="destination">Destination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Your story *</Label>
                  <Textarea required rows={6} placeholder="How you met, the proposal, the wedding day..." value={form.story || ""} onChange={e => set("story", e.target.value)} />
                </div>
                <div>
                  <Label>Cover photo URL</Label>
                  <Input placeholder="https://..." value={form.cover_image_url || ""} onChange={e => set("cover_image_url", e.target.value)} />
                </div>
                <div>
                  <Label>Gallery photo URLs (one per line)</Label>
                  <Textarea rows={4} placeholder="https://...&#10;https://..." value={form.gallery || ""} onChange={e => set("gallery", e.target.value)} />
                </div>
                <div>
                  <Label>Vendors used (free text)</Label>
                  <Textarea rows={3} value={form.vendors_text || ""} onChange={e => set("vendors_text", e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Business name *</Label>
                  <Input required value={form.business_name || ""} onChange={e => set("business_name", e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select value={form.category || ""} onValueChange={v => set("category", v)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venues">Venues</SelectItem>
                        <SelectItem value="photographers">Photographers</SelectItem>
                        <SelectItem value="videographers">Videographers</SelectItem>
                        <SelectItem value="decorators">Decorators</SelectItem>
                        <SelectItem value="catering">Catering</SelectItem>
                        <SelectItem value="makeup_artists">Makeup Artists</SelectItem>
                        <SelectItem value="mc_entertainment">MC & Entertainment</SelectItem>
                        <SelectItem value="car_hire">Car Hire</SelectItem>
                        <SelectItem value="sound_lighting">Sound & Lighting</SelectItem>
                        <SelectItem value="wedding_planners">Wedding Planners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location *</Label>
                    <Input required value={form.location || ""} onChange={e => set("location", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea required rows={5} value={form.description || ""} onChange={e => set("description", e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input placeholder="https://..." value={form.website || ""} onChange={e => set("website", e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: existing vendors can also <Link to="/auth?tab=vendor" className="text-primary underline">register directly</Link> to get instant access to the vendor dashboard.
                </p>
              </>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Submit;
