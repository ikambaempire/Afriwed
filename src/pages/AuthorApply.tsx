import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PenLine } from "lucide-react";

const AuthorApply = () => {
  const { user, loading, isAuthor } = useAuth();
  const [displayName, setName] = useState("");
  const [bio, setBio] = useState("");
  const [samples, setSamples] = useState("");
  const [existing, setExisting] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("author_applications").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setExisting(data);
          setName(data.display_name || "");
          setBio(data.bio || "");
          setSamples(data.sample_links || "");
        }
      });
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (isAuthor) return <Navigate to="/author-dashboard" replace />;

  const submit = async () => {
    if (!displayName.trim()) { toast.error("Add your display name"); return; }
    setSubmitting(true);
    const { error } = await (supabase as any).from("author_applications").insert({
      user_id: user.id, display_name: displayName, bio, sample_links: samples,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Application submitted — we'll review shortly"); setExisting({ ...existing, status: "pending", display_name: displayName }); }
  };

  return (
    <>
      <Helmet>
        <title>Become an Afriwedd Author</title>
        <meta name="description" content="Apply to write stories and editorials for Afriwedd." />
        <link rel="canonical" href="https://haruwa1.lovable.app/author-apply" />
      </Helmet>
      <Header />
      <main className="pt-24 pb-16 bg-background min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <PenLine className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">Become an Afriwedd Author</h1>
            <p className="text-muted-foreground mt-2">Share African wedding stories with our global community.</p>
          </div>
          <Card>
            <CardHeader><CardTitle>Your application</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {existing && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Current status:</span>
                  <Badge variant={existing.status === "approved" ? "default" : existing.status === "rejected" ? "destructive" : "secondary"}>{existing.status}</Badge>
                </div>
              )}
              <div><Label>Display name</Label><Input value={displayName} onChange={e => setName(e.target.value)} placeholder="Jane Doe" /></div>
              <div><Label>Short bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell us about your writing background..." /></div>
              <div><Label>Sample work (URLs)</Label><Textarea value={samples} onChange={e => setSamples(e.target.value)} rows={3} placeholder="Links to past published articles" /></div>
              <Button onClick={submit} disabled={submitting} className="w-full">{submitting ? "Submitting..." : existing ? "Resubmit application" : "Submit application"}</Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AuthorApply;
