import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, AlertTriangle, XCircle, Lightbulb, Check, Loader2, Heading2, ListTree, KeyRound } from "lucide-react";
import type { SeoValue } from "./SeoPanel";
import { applySeoContentAction, type SeoContentSuggestion } from "@/lib/seoApply";

export type AiIssue = {
  severity: "critical" | "warning" | "tip";
  area: string;
  problem: string;
  fix: string;
  field?: "meta_title" | "meta_description" | "focus_keyword" | "slug" | null;
  suggested_value?: string | null;
  content_action?: SeoContentSuggestion | null;
};

const sevStyle: Record<string, { icon: any; cls: string; label: string }> = {
  critical: { icon: XCircle, cls: "text-destructive", label: "Fix" },
  warning: { icon: AlertTriangle, cls: "text-amber-500", label: "Improve" },
  tip: { icon: Lightbulb, cls: "text-primary", label: "Tip" },
};

const actionMeta: Record<string, { icon: any; label: string }> = {
  rewrite_heading: { icon: Heading2, label: "Apply heading fix" },
  convert_to_heading: { icon: Heading2, label: "Turn into a heading" },
  insert_heading: { icon: Heading2, label: "Insert heading" },
  insert_outline: { icon: ListTree, label: "Apply outline" },
  rewrite_paragraph: { icon: KeyRound, label: "Apply keyword rewrite" },
};

interface Props {
  value: SeoValue;
  onChange: (patch: Partial<SeoValue>) => void;
}


const AiSeoAudit = ({ value, onChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<AiIssue[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [applied, setApplied] = useState<Record<number, boolean>>({});

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-audit", {
        body: {
          title: value.title,
          slug: value.slug,
          excerpt: value.excerpt,
          content_html: value.content_html,
          meta_title: value.meta_title,
          meta_description: value.meta_description,
          focus_keyword: value.focus_keyword,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setIssues(((data as any)?.issues ?? []) as AiIssue[]);
      setScore((data as any)?.score ?? null);
      setSummary((data as any)?.summary ?? "");
      setApplied({});
    } catch (e: any) {
      toast.error(e?.message || "SEO check failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const apply = (i: number, issue: AiIssue) => {
    if (!issue.field || !issue.suggested_value) return;
    onChange({ [issue.field]: issue.suggested_value } as Partial<SeoValue>);
    setApplied(a => ({ ...a, [i]: true }));
    toast.success("Suggestion applied");
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/[0.03] p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium">AI SEO test</p>
        {score !== null && (
          <Badge className="ml-auto" variant={score >= 75 ? "default" : "secondary"}>{score}/100</Badge>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Like a grammar checker, but for SEO — it reads your story and flags long headings, thin sections, weak titles and more, with a suggested fix for each.
      </p>
      <Button size="sm" className="w-full" onClick={run} disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Reading your story…</> : <><Sparkles className="w-4 h-4 mr-1" />Run SEO test</>}
      </Button>

      {summary && <p className="text-xs text-muted-foreground italic">{summary}</p>}

      {issues && issues.length === 0 && (
        <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />No SEO problems found. Nice work!</p>
      )}

      {issues && issues.length > 0 && (
        <ul className="space-y-2">
          {issues.map((it, i) => {
            const s = sevStyle[it.severity] ?? sevStyle.tip;
            const S = s.icon;
            return (
              <li key={i} className="rounded-md border border-border bg-background p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <S className={`w-3.5 h-3.5 shrink-0 ${s.cls}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">{it.area}</span>
                  <span className={`ml-auto text-[10px] ${s.cls}`}>{s.label}</span>
                </div>
                <p className="text-xs text-foreground">{it.problem}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Fix: </span>{it.fix}</p>
                {it.field && it.suggested_value && (
                  <Button
                    size="sm" variant={applied[i] ? "secondary" : "outline"} className="h-7 text-xs"
                    onClick={() => apply(i, it)} disabled={applied[i]}
                  >
                    {applied[i] ? <><Check className="w-3 h-3 mr-1" />Applied</> : "Apply suggestion"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AiSeoAudit;
