import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

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
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  is_published: boolean;
}

const AUTO_MS = 4000;

const isLive = (a: Ad) => {
  const now = Date.now();
  if (!a.is_published || !a.is_active) return false;
  if (a.start_date && new Date(a.start_date).getTime() > now) return false;
  if (a.end_date && new Date(a.end_date).getTime() < now) return false;
  return true;
};

const hrefFor = (ad: Ad) => ad.cta_link || (ad.vendor_id ? `/vendor/${ad.vendor_id}` : null);

const AdMedia = ({ ad, onVideoEnded }: { ad: Ad; onVideoEnded?: () => void }) => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "square">("landscape");
  const objectFitClass =
    orientation === "portrait" ? "object-contain bg-black/90" : "object-cover";

  if (ad.media_type === "video") {
    return (
      <video
        src={ad.media_url}
        className={`w-full h-full ${objectFitClass} transition-transform duration-700 group-hover:scale-[1.02]`}
        autoPlay
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          const r = v.videoWidth / v.videoHeight;
          setOrientation(r < 0.95 ? "portrait" : r > 1.05 ? "landscape" : "square");
        }}
        onEnded={onVideoEnded}
      />
    );
  }
  return (
    <img
      src={ad.media_url}
      alt={ad.title}
      className={`w-full h-full ${objectFitClass} transition-transform duration-700 group-hover:scale-[1.03]`}
      loading="lazy"
      onLoad={(e) => {
        const img = e.currentTarget;
        const r = img.naturalWidth / img.naturalHeight;
        setOrientation(r < 0.95 ? "portrait" : r > 1.05 ? "landscape" : "square");
      }}
    />
  );
};

const AdCard = ({ ads }: { ads: Ad[] }) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ad = ads[idx];
  const isVideo = ad?.media_type === "video";
  const multiple = ads.length > 1;

  const next = useCallback(() => setIdx((i) => (i + 1) % ads.length), [ads.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + ads.length) % ads.length), [ads.length]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!multiple || paused || isVideo) return;
    timer.current = setTimeout(next, AUTO_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [idx, multiple, paused, isVideo, next]);

  // Preload next image
  useEffect(() => {
    if (!multiple) return;
    const nxt = ads[(idx + 1) % ads.length];
    if (nxt && nxt.media_type !== "video") {
      const im = new Image();
      im.src = nxt.media_url;
    }
  }, [idx, ads, multiple]);

  if (!ad) return null;

  const href = hrefFor(ad);
  const inner = (
    <div className="group relative w-full h-full flex flex-col">
      <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] bg-muted overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={ad.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <AdMedia ad={ad} onVideoEnded={multiple ? next : undefined} />
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-background/95 text-foreground border-none text-[10px] tracking-widest uppercase gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-primary" />Sponsored
          </Badge>
        </div>

        {multiple && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prev(); }}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/85 backdrop-blur border border-border shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); next(); }}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/85 backdrop-blur border border-border shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setIdx(i); }}
                  aria-label={`Go to ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-1.5 bg-background/80"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display text-lg md:text-xl font-bold text-foreground leading-snug line-clamp-2 mb-1.5">
          {ad.title}
        </h3>
        {ad.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ad.description}</p>
        )}
        {href && (
          <span className="mt-auto inline-flex items-center gap-1.5 text-primary text-sm font-semibold group-hover:gap-2.5 transition-all">
            {ad.cta_text || "Learn more"} <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );

  const wrapperClass =
    "relative block overflow-hidden rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1 h-full";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || !multiple) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
      className="h-full"
    >
      {href ? (
        /^https?:\/\//.test(href) ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={wrapperClass}>{inner}</a>
        ) : (
          <Link to={href} className={wrapperClass}>{inner}</Link>
        )
      ) : (
        <div className={wrapperClass}>{inner}</div>
      )}
    </div>
  );
};

const AdBanner = () => {
  const { t } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);

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
    const channel = supabase
      .channel("public-ads")
      .on("postgres_changes", { event: "*", schema: "public", table: "advertisements" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const cardKeys = ["card_1", "card_2", "card_3"] as const;
  const grouped = cardKeys.map((k) => ads.filter((a) => {
    const p = a.position && a.position.startsWith("card_") ? a.position : "card_1";
    return p === k;
  }));
  const totalLive = grouped.reduce((s, g) => s + g.length, 0);
  if (totalLive === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-1">
              {t("Featured Partners")}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t("Curated for your wedding")}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {grouped.map((groupAds, i) =>
            groupAds.length > 0 ? (
              <motion.div
                key={cardKeys[i]}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={i === 2 ? "sm:col-span-2 lg:col-span-1" : ""}
              >
                <AdCard ads={groupAds} />
              </motion.div>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
};

export default AdBanner;
