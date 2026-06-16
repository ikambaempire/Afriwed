import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const AuthorApplicationsTab = () => {
  const [apps, setApps] = useState<any[]>([]);

  const load = async () => {
    const { data } = await (supabase as any).from("author_applications").select("*").order("created_at", { ascending: false });
    setApps(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const approve = async (a: any) => {
    // 1. Add author role
    const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: a.user_id, role: "author" as any });
    if (roleErr && !roleErr.message.includes("duplicate")) { toast({ title: "Error", description: roleErr.message, variant: "destructive" }); return; }

    // 2. Create or link blog_authors row
    const { data: existing } = await (supabase as any).from("blog_authors").select("id").eq("user_id", a.user_id).maybeSingle();
    if (!existing) {
      let slug = slugify(a.display_name);
      const { data: dup } = await (supabase as any).from("blog_authors").select("id").eq("slug", slug).maybeSingle();
      if (dup) slug = `${slug}-${a.user_id.slice(0, 6)}`;
      const { error: aErr } = await (supabase as any).from("blog_authors").insert({
        user_id: a.user_id, display_name: a.display_name, bio: a.bio || null, slug,
      });
      if (aErr) { toast({ title: "Error", description: aErr.message, variant: "destructive" }); return; }
    }

    await (supabase as any).from("author_applications").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", a.id);
    toast({ title: "Author approved" });
    load();
  };

  const reject = async (a: any) => {
    await (supabase as any).from("author_applications").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", a.id);
    toast({ title: "Application rejected" });
    load();
  };

  const pending = apps.filter(a => a.status === "pending");
  const history = apps.filter(a => a.status !== "pending");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Pending Author Applications ({pending.length})</CardTitle></CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending applications</p>
          ) : (
            <div className="space-y-3">
              {pending.map(a => (
                <div key={a.id} className="p-4 bg-muted rounded-lg space-y-3">
                  <div>
                    <p className="font-medium">{a.display_name}</p>
                    {a.bio && <p className="text-sm text-muted-foreground mt-1">{a.bio}</p>}
                    {a.sample_links && <p className="text-xs text-primary mt-1 whitespace-pre-line break-all">{a.sample_links}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Submitted {new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve(a)}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => reject(a)}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Decision History</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {history.map(a => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.display_name}</p>
                    <p className="text-xs text-muted-foreground">{a.reviewed_at ? new Date(a.reviewed_at).toLocaleString() : ""}</p>
                  </div>
                  <Badge variant={a.status === "approved" ? "default" : "destructive"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuthorApplicationsTab;
