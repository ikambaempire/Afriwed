import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";
import type { SeoValue } from "./SeoPanel";

export type LiveIssue = { label: string; state: "good" | "warn" | "bad"; hint?: string };

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const liveSeoIssues = (v: SeoValue): LiveIssue[] => {
  const kw = v.focus_keyword.trim().toLowerCase();
  const text = stripHtml(v.content_html);
  const lower = text.toLowerCase();
  const words = text ? text.split(" ").length : 0;
  const metaTitle = v.meta_title || v.title;
  const metaDesc = v.meta_description || stripHtml(v.excerpt);
  const headings = Array.from(v.content_html.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi));
  const h2s = headings.filter(h => h[1].toLowerCase() === "h2").length;
  const longHeading = headings.find(h => stripHtml(h[2]).length > 70);
  const paragraphs = (v.content_html.match(/<p[\s>]/gi) || []).length;
  const longPara = /<p[^>]*>[\s\S]{700,}?<\/p>/i.test(v.content_html);
  const imgs = (v.content_html.match(/<img\s/gi) || []).length;
  const noAlt = (v.content_html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;
  const firstPara = stripHtml((v.content_html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]) || "").toLowerCase();

  const issues: LiveIssue[] = [
    {
      label: `SEO title ${metaTitle.length}/60`,
      state: metaTitle.length === 0 ? "bad" : metaTitle.length > 60 || metaTitle.length < 30 ? "warn" : "good",
      hint: metaTitle.length > 60 ? "Shorten it — Google cuts titles after ~60 characters." : metaTitle.length < 30 ? "Too short to rank well — add detail." : undefined,
    },
    {
      label: `Meta description ${metaDesc.length}/160`,
      state: metaDesc.length === 0 ? "bad" : metaDesc.length > 160 || metaDesc.length < 70 ? "warn" : "good",
      hint: metaDesc.length > 160 ? "Trim it so it isn't truncated in search results." : undefined,
    },
    {
      label: `${words} words`,
      state: words >= 300 ? "good" : words >= 120 ? "warn" : "bad",
      hint: words < 300 ? "Aim for 300+ words for a story to rank." : undefined,
    },
    {
      label: h2s > 0 ? `${h2s} H2 section heading${h2s > 1 ? "s" : ""}` : "No H2 section headings",
      state: h2s >= 2 ? "good" : h2s === 1 ? "warn" : "bad",
      hint: h2s < 2 ? "Break the story into sections with H2 headings." : undefined,
    },
    {
      label: longHeading ? "A heading is too long" : "Heading lengths look good",
      state: longHeading ? "warn" : "good",
      hint: longHeading ? `"${stripHtml(longHeading[2]).slice(0, 60)}…" is over 70 characters.` : undefined,
    },
    {
      label: longPara || paragraphs < 3 ? "Paragraphs are too long" : "Readable paragraph lengths",
      state: longPara || paragraphs < 3 ? "warn" : "good",
      hint: longPara ? "Split walls of text into 2–3 sentence paragraphs." : undefined,
    },
    {
      label: /<a\s/i.test(v.content_html) ? "Contains links" : "No links yet",
      state: /<a\s/i.test(v.content_html) ? "good" : "warn",
      hint: "Add at least one relevant link.",
    },
    {
      label: v.featured_image_url ? "Featured image set" : "No featured image",
      state: v.featured_image_url ? "good" : "bad",
    },
    {
      label: imgs === 0 ? "No in-article images" : noAlt > 0 ? `${noAlt} image(s) missing alt text` : "All images have alt text",
      state: imgs === 0 ? "warn" : noAlt > 0 ? "warn" : "good",
    },
  ];

  if (kw) {
    issues.unshift(
      { label: "Keyword in SEO title", state: metaTitle.toLowerCase().includes(kw) ? "good" : "bad", hint: "Put the focus keyword in the SEO title." },
      { label: "Keyword in URL slug", state: v.slug.toLowerCase().includes(kw.replace(/\s+/g, "-")) ? "good" : "warn" },
      { label: "Keyword in meta description", state: metaDesc.toLowerCase().includes(kw) ? "good" : "warn" },
      { label: "Keyword in first paragraph", state: firstPara.includes(kw) ? "good" : "warn", hint: "Mention the keyword in the opening paragraph." },
      { label: "Keyword in a heading", state: headings.some(h => stripHtml(h[2]).toLowerCase().includes(kw)) ? "good" : "warn" },
      { label: "Keyword in content", state: lower.includes(kw) ? "good" : "bad" },
    );
  } else {
    issues.unshift({ label: "No focus keyword set", state: "bad", hint: "Set a focus keyword to unlock keyword checks." });
  }

  return issues;
};

export const liveSeoScore = (issues: LiveIssue[]) => {
  const pts = issues.reduce((n, i) => n + (i.state === "good" ? 1 : i.state === "warn" ? 0.5 : 0), 0);
  return Math.round((pts / issues.length) * 100);
};

const useDebounced = <T,>(value: T, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const Icon = ({ state }: { state: LiveIssue["state"] }) =>
  state === "good" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
    : state === "warn" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
      : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />;

const LiveSeoMeter = ({ value }: { value: SeoValue }) => {
  const debounced = useDebounced(value, 400);
  const issues = useMemo(() => liveSeoIssues(debounced), [debounced]);
  const score = liveSeoScore(issues);
  const problems = issues.filter(i => i.state !== "good");
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? issues : problems;

  const tone = score >= 75 ? "text-green-700" : score >= 45 ? "text-amber-600" : "text-destructive";
  const bar = score >= 75 ? "bg-green-600" : score >= 45 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium">Live SEO score</p>
        <span className={`ml-auto text-sm font-semibold ${tone}`}>{score}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div className={`h-full ${bar} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {problems.length === 0
          ? "No live issues — run the AI SEO test for deeper checks."
          : `${problems.length} issue${problems.length > 1 ? "s" : ""} to fix as you write.`}
      </p>
      <ul className="space-y-1.5">
        {list.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Icon state={c.state} />
            <span>
              {c.label}
              {c.state !== "good" && c.hint && <span className="block text-[11px] opacity-80">{c.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => setShowAll(s => !s)}>
        {showAll ? "Show only issues" : `Show all ${issues.length} checks`}
      </button>
    </div>
  );
};

export default LiveSeoMeter;
