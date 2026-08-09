import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import AiSeoAudit from "./AiSeoAudit";
import LiveSeoMeter, { liveSeoIssues, liveSeoScore } from "./LiveSeoMeter";


export interface SeoValue {
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string;
  og_image_url: string;
  featured_image_url: string;
}

const SITE = "https://afriwedd.lovable.app";

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

type Check = { label: string; state: "good" | "warn" | "bad" };

export const seoChecks = (v: SeoValue): Check[] => {
  const kw = v.focus_keyword.trim().toLowerCase();
  const text = stripHtml(v.content_html).toLowerCase();
  const words = text ? text.split(" ").length : 0;
  const metaTitle = v.meta_title || v.title;
  const metaDesc = v.meta_description || stripHtml(v.excerpt);

  const checks: Check[] = [
    {
      label: `SEO title length ${metaTitle.length}/60`,
      state: metaTitle.length === 0 ? "bad" : metaTitle.length > 60 ? "warn" : metaTitle.length < 30 ? "warn" : "good",
    },
    {
      label: `Meta description length ${metaDesc.length}/160`,
      state: metaDesc.length === 0 ? "bad" : metaDesc.length > 160 ? "warn" : metaDesc.length < 70 ? "warn" : "good",
    },
    { label: `Content length ${words} words (300+ recommended)`, state: words >= 300 ? "good" : words >= 120 ? "warn" : "bad" },
    { label: v.featured_image_url ? "Featured image set" : "No featured image", state: v.featured_image_url ? "good" : "bad" },
    { label: /<h2|<h3/i.test(v.content_html) ? "Uses subheadings" : "Add subheadings (H2/H3) to break up sections", state: /<h2|<h3/i.test(v.content_html) ? "good" : "warn" },
    { label: /<a\s/i.test(v.content_html) ? "Contains links" : "Add at least one link", state: /<a\s/i.test(v.content_html) ? "good" : "warn" },
  ];

  if (kw) {
    checks.unshift(
      { label: "Keyword in SEO title", state: metaTitle.toLowerCase().includes(kw) ? "good" : "bad" },
      { label: "Keyword in URL slug", state: v.slug.toLowerCase().includes(kw.replace(/\s+/g, "-")) ? "good" : "warn" },
      { label: "Keyword in meta description", state: metaDesc.toLowerCase().includes(kw) ? "good" : "warn" },
      { label: "Keyword in content", state: text.includes(kw) ? "good" : "bad" },
    );
  } else {
    checks.unshift({ label: "Set a focus keyword to get keyword analysis", state: "warn" });
  }
  return checks;
};

const Icon = ({ state }: { state: Check["state"] }) =>
  state === "good" ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
    : state === "warn" ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      : <XCircle className="w-4 h-4 text-destructive shrink-0" />;

interface Props {
  value: SeoValue;
  onChange: (patch: Partial<SeoValue>) => void;
}

const SeoPanel = ({ value, onChange }: Props) => {
  const checks = seoChecks(value);
  const score = Math.round((checks.filter(c => c.state === "good").length / checks.length) * 100);
  const previewTitle = value.meta_title || value.title || "Your story title";
  const previewDesc = (value.meta_description || stripHtml(value.excerpt) || "Write a meta description so readers know what this story is about.").slice(0, 165);

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" /> SEO &amp; search preview
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${score >= 75 ? "bg-green-600/10 text-green-700" : score >= 45 ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive"}`}>
            Score {score}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google-style snippet */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-[11px] text-muted-foreground truncate">{SITE}/stories/{value.slug || "your-story-slug"}</p>
          <p className="text-[#1a0dab] dark:text-primary text-lg leading-snug truncate">{previewTitle}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{previewDesc}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Focus keyword</Label>
            <Input value={value.focus_keyword} onChange={e => onChange({ focus_keyword: e.target.value })} placeholder="e.g. Rwandan traditional wedding" />
          </div>
          <div>
            <Label className="text-xs">Canonical URL (optional)</Label>
            <Input value={value.canonical_url} onChange={e => onChange({ canonical_url: e.target.value })} placeholder="Leave empty to use the default" />
          </div>
        </div>

        <div>
          <Label className="text-xs flex justify-between">
            <span>SEO title</span>
            <span className={(value.meta_title || value.title).length > 60 ? "text-destructive" : "text-muted-foreground"}>
              {(value.meta_title || value.title).length}/60
            </span>
          </Label>
          <Input value={value.meta_title} onChange={e => onChange({ meta_title: e.target.value })} placeholder={value.title || "Defaults to the article title"} />
        </div>

        <div>
          <Label className="text-xs flex justify-between">
            <span>Meta description</span>
            <span className={(value.meta_description || "").length > 160 ? "text-destructive" : "text-muted-foreground"}>
              {(value.meta_description || "").length}/160
            </span>
          </Label>
          <Textarea rows={3} value={value.meta_description} onChange={e => onChange({ meta_description: e.target.value })} placeholder="One or two sentences that make people click." />
        </div>

        <div>
          <Label className="text-xs">Social share image URL (optional)</Label>
          <Input value={value.og_image_url} onChange={e => onChange({ og_image_url: e.target.value })} placeholder="Defaults to the featured image" />
        </div>

        <LiveSeoMeter value={value} />

        <AiSeoAudit value={value} onChange={onChange} />

      </CardContent>
    </Card>
  );
};

export default SeoPanel;
