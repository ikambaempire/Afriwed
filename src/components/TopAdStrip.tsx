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
    const current = ads[idx];
    const delay = current?.media_type === "video" ? 12000 : 6000;
    timer.current = setTimeout(next, delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx, ads, hidden, next]);

  const current = ads[idx];
  const href = current ? hrefFor(current) : null;
  const isVideo = current?.media_type === "video";

  const media = current && (
    isVideo ? (
      <video
        src={current.media_url}
        className="h-full w-auto object-contain rounded-md shadow-sm bg-black"
        autoPlay
        muted
        loop
        playsInline
      />
    ) : current.media_url ? (
      <img
        src={current.media_url}
        alt=""
        className="h-full w-auto object-contain rounded-md shadow-sm bg-muted"
        loading="lazy"
      />
    ) : null
  );

  const inner = current ? (
    <div className="flex items-center gap-4 h-full py-2">
      {media && <div className="h-full flex-shrink-0 flex items-center">{media}</div>}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.25em] uppercase font-semibold text-primary">
          <Sparkles className="w-3 h-3" /> Sponsored
        </span>
        <span className="truncate text-sm md:text-base font-semibold text-foreground leading-tight">
          {current.title}
        </span>
        {current.description && (
          <span className="hidden sm:block truncate text-xs text-muted-foreground">{current.description}</span>
        )}
      </div>
      {href && (
        <span className="hidden sm:inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-primary shrink-0 whitespace-nowrap">
          {current.cta_text || "Learn more"} <ArrowRight className="w-3 h-3" />
        </span>
      )}
    </div>
  ) : null;

  return (
    <div
      className={`overflow-hidden bg-secondary/60 border-b border-border transition-all duration-300 ease-out ${
        hidden || !current ? "max-h-0 opacity-0" : "max-h-32 opacity-100"
      }`}
      aria-hidden={hidden || !current}
    >
      <div className="container mx-auto px-4 h-24 md:h-28">
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
