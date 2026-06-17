import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const PromoteAuthorCard = ({ onDone }: { onDone?: () => void }) => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  const promote = async () => {
    if (!email.trim() || !displayName.trim()) {
      toast({ title: "Email and display name are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data: profile, error: pErr } = await supabase
        .from("profiles").select("user_id, email").ilike("email", email.trim()).maybeSingle();
      if (pErr) throw pErr;
      if (!profile) {
        toast({ title: "User not found", description: "They must create an account first.", variant: "destructive" });
        return;
      }

      const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: profile.user_id, role: "author" as any });
      if (roleErr && !roleErr.message.toLowerCase().includes("duplicate")) throw roleErr;

      const { data: existing } = await (supabase as any).from("blog_authors").select("id").eq("user_id", profile.user_id).maybeSingle();
      if (!existing) {
        let slug = slugify(displayName);
        const { data: dup } = await (supabase as any).from("blog_authors").select("id").eq("slug", slug).maybeSingle();
        if (dup) slug = `${slug}-${profile.user_id.slice(0, 6)}`;
        const { error: aErr } = await (supabase as any).from("blog_authors").insert({
          user_id: profile.user_id, display_name: displayName, bio: bio || null, slug,
        });
        if (aErr) throw aErr;
      }

      toast({ title: "Author added", description: `${displayName} can now publish articles.` });
      setEmail(""); setDisplayName(""); setBio("");
      onDone?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4" />Promote user to Author by email</CardTitle></CardHeader>
      <CardContent className="space-y-3 max-w-xl">
        <p className="text-xs text-muted-foreground">User must already have a Haruwa/Afriwedd account. We'll grant the author role and set up their public profile.</p>
        <div><Label>User email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="writer@example.com" /></div>
        <div><Label>Public display name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Jane Mukamana" /></div>
        <div><Label>Short bio (optional)</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} /></div>
        <Button onClick={promote} disabled={busy}>{busy ? "Adding…" : "Make Author"}</Button>
      </CardContent>
    </Card>
  );
};

export default PromoteAuthorCard;
