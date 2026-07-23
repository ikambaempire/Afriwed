import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: string;
  vendor_id: string | null;
  cta_text: string | null;
  cta_link: string | null;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  is_published: boolean;
}

const isLive = (a: Ad) => {
  const now = Date.now();
  if (!a.is_published || !a.is_active) return false;
  if (a.start_date && new Date(a.start_date).getTime() > now) return false;
  if (a.end_date && new Date(a.end_date).getTime() < now) return false;
  return true;
};

const hrefFor = (ad: Ad) => ad.cta_link || (ad.vendor_id ? `/vendor/${ad.vendor_id}` : null);

interface Props {
  hidden: boolean;
}

const TopAdStrip = ({ hidden }: Props) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("advertisements")
        .select("*")
        .eq("is_published", true)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      setAds(((data ?? []) as Ad[]).filter(isLive));
    };
    load();
    const ch = supabase
      .channel("top-strip-ads")
      .on("postgres_changes", { event: "*", schema: "public", table: "advertisements" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const next = useCallback(() => setIdx((i) => (ads.length ? (i + 1) % ads.length : 0)), [ads.length]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (ads.length < 2 || hidden) return;
    timer.current = setTimeout(next, 5000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx, ads.length, hidden, next]);

  const current = ads[idx];

  const inner = current ? (
    <div className="flex items-center gap-3 h-full">
      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] tracking-[0.25em] uppercase font-semibold text-primary shrink-0">
        <Sparkles className="w-3 h-3" /> Sponsored
      </span>
      {current.media_url && current.media_type !== "video" && (
        <img
          src={current.media_url}
          alt=""
          className="hidden sm:block h-6 w-10 object-cover rounded-sm shrink-0"
          loading="lazy"
        />
      )}
      <span className="truncate text-xs md:text-sm font-medium text-foreground">
        {current.title}
        {current.description && <span className="hidden md:inline text-muted-foreground"> — {current.description}</span>}
      </span>
      {hrefFor(current) && (
        <span className="ml-auto hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
          {current.cta_text || "Learn more"} <ArrowRight className="w-3 h-3" />
        </span>
      )}
    </div>
  ) : null;

  const href = current ? hrefFor(current) : null;

  return (
    <div
      className={`overflow-hidden bg-secondary/60 border-b border-border transition-all duration-300 ease-out ${
        hidden || !current ? "max-h-0 opacity-0" : "max-h-11 opacity-100"
      }`}
      aria-hidden={hidden || !current}
    >
      <div className="container mx-auto px-4 h-11">
        {current && (
          href ? (
            /^https?:\/\//.test(href) ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">{inner}</a>
            ) : (
              <Link to={href} className="block h-full">{inner}</Link>
            )
          ) : (
            <div className="h-full">{inner}</div>
          )
        )}
      </div>
    </div>
  );
};

export default TopAdStrip;
