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

type Orientation = "portrait" | "landscape" | "square";

const AdSlide = ({
  ad,
  active,
  onVideoEnded,
}: {
  ad: Ad;
  active: boolean;
  onVideoEnded: () => void;
}) => {
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active]);

  const fit = orientation === "landscape" ? "object-cover" : "object-contain";

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-secondary/60 to-muted/60">
      {ad.media_type === "video" ? (
        <video
          ref={videoRef}
          src={ad.media_url}
          className={`w-full h-full ${fit}`}
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
      ) : (
        <img
          src={ad.media_url}
          alt={ad.title}
          className={`w-full h-full ${fit}`}
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget;
            const r = img.naturalWidth / img.naturalHeight;
            setOrientation(r < 0.95 ? "portrait" : r > 1.05 ? "landscape" : "square");
          }}
        />
      )}

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      {/* Sponsored badge */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6">
        <Badge className="bg-background/95 text-foreground border-none text-[10px] md:text-xs tracking-[0.25em] uppercase gap-1.5 shadow-md px-3 py-1.5">
          <Sparkles className="w-3 h-3 text-primary" /> Sponsored
        </Badge>
      </div>

      {/* Copy */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-12">
        <div className="max-w-2xl">
          <h3 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-lg mb-2 md:mb-3">
            {ad.title}
          </h3>
          {ad.description && (
            <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow mb-4">
              {ad.description}
            </p>
          )}
          {hrefFor(ad) && (
            <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 md:px-6 md:py-3 rounded-full font-semibold text-sm md:text-base shadow-lg hover:gap-3 transition-all">
              {ad.cta_text || "Learn more"} <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const AdBanner = () => {
  const { t } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
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
      const live = ((data ?? []) as Ad[]).filter(isLive);
      setAds(live);
      setIdx((i) => (i >= live.length ? 0 : i));
    };
    load();
    const ch = supabase
      .channel("public-ads")
      .on("postgres_changes", { event: "*", schema: "public", table: "advertisements" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const next = useCallback(() => setIdx((i) => (ads.length ? (i + 1) % ads.length : 0)), [ads.length]);
  const prev = useCallback(() => setIdx((i) => (ads.length ? (i - 1 + ads.length) % ads.length : 0)), [ads.length]);

  const current = ads[idx];
  const isVideo = current?.media_type === "video";

  // Auto-advance for images only. Videos advance via onEnded.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!current || ads.length < 2 || paused || isVideo) return;
    timer.current = setTimeout(next, AUTO_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx, ads.length, paused, isVideo, current, next]);

  // Preload next image
  useEffect(() => {
    if (ads.length < 2) return;
    const nxt = ads[(idx + 1) % ads.length];
    if (nxt && nxt.media_type !== "video") {
      const im = new Image();
      im.src = nxt.media_url;
    }
  }, [idx, ads]);

  if (!current) return null;

  const href = hrefFor(current);
  const multiple = ads.length > 1;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const cls = "block w-full h-full";
    if (!href) return <div className={cls}>{children}</div>;
    return /^https?:\/\//.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
    ) : (
      <Link to={href} className={cls}>{children}</Link>
    );
  };

  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6 md:mb-8 flex-wrap gap-3">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-1.5">
              {t("Featured Partners")}
            </p>
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              {t("Curated for your wedding")}
            </h2>
          </div>
          {multiple && (
            <p className="text-sm text-muted-foreground">
              {idx + 1} / {ads.length}
            </p>
          )}
        </div>

        <div
          className="group relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-border shadow-card hover:shadow-card-hover transition-shadow duration-500 bg-card"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null || !multiple) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
            touchX.current = null;
          }}
        >
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Wrapper>
                  <AdSlide ad={current} active onVideoEnded={next} />
                </Wrapper>
              </motion.div>
            </AnimatePresence>

            {multiple && (
              <>
                <button
                  onClick={prev}
                  aria-label="Previous advertisement"
                  className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110 z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next advertisement"
                  className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110 z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-background/70 backdrop-blur-sm rounded-full px-3 py-2">
                  {ads.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      aria-label={`Go to advertisement ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-1.5 bg-foreground/40 hover:bg-foreground/70"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdBanner;
