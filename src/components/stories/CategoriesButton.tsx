import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

type Cat = { id: string; slug: string; name: string };

interface Props {
  cats: Cat[];
  activeCat: string;
  label?: string;
  allLabel?: string;
}

const CategoriesButton = ({ cats, activeCat, label, allLabel }: Props) => {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("status", "publish")
        .eq("language", lang);
      const ids = (posts ?? []).map((p: any) => p.id);
      setTotal(ids.length);
      if (!ids.length) { setCounts({}); return; }
      const { data: rel } = await supabase
        .from("blog_post_categories")
        .select("category_id, post_id")
        .in("post_id", ids);
      const map: Record<string, number> = {};
      (rel ?? []).forEach((r: any) => { map[r.category_id] = (map[r.category_id] ?? 0) + 1; });
      setCounts(map);
    })();
  }, [lang]);

  const activeName =
    activeCat === "all"
      ? (allLabel || t("All"))
      : cats.find((c) => c.slug === activeCat)?.name || (allLabel || t("All"));

  const sorted = [...cats]
    .map((c) => ({ ...c, count: counts[c.id] || 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:opacity-90 transition"
      >
        <LayoutGrid className="w-4 h-4" />
        <span>{label || t("Categories")}</span>
        <span className="hidden sm:inline text-primary-foreground/80">·</span>
        <span className="hidden sm:inline text-primary-foreground/90 text-xs font-medium truncate max-w-[10rem]">
          {activeName}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 left-0 w-[92vw] sm:w-[520px] max-w-[95vw] bg-popover border border-border rounded-2xl shadow-xl p-2 animate-in fade-in-0 zoom-in-95"
        >
          <div className="max-h-[65vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1">
            <Link
              to="/stories"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                activeCat === "all" ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                {allLabel || t("All")}
                {activeCat === "all" && <Check className="w-4 h-4 shrink-0" />}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{total}</span>
            </Link>
            {sorted.map((c) => (
              <Link
                key={c.id}
                to={`/stories?category=${c.slug}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                  activeCat === c.slug ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="truncate">{c.name}</span>
                  {activeCat === c.slug && <Check className="w-4 h-4 shrink-0" />}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesButton;
