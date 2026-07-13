import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  start_date: string | null;
  end_date: string | null;
}

const isLive = (a: Ad) => {
  const now = Date.now();
  if (a.start_date && new Date(a.start_date).getTime() > now) return false;
  if (a.end_date && new Date(a.end_date).getTime() < now) return false;
  return true;
};

const AdCard = ({ ad, size = "md" }: { ad: Ad; size?: "lg" | "md" | "sm" }) => {
  const href = ad.cta_link || (ad.vendor_id ? `/vendor/${ad.vendor_id}` : null);
  const heights: Record<string, string> = { lg: "h-72 md:h-96", md: "h-60 md:h-72", sm: "h-56 md:h-64" };
  const inner = (
    <div className={`group relative w-full ${heights[size]} rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500`}>
      {ad.media_type === "video" ? (
        <video src={ad.media_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" autoPlay muted loop playsInline />
      ) : (
        <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <div className="absolute top-4 left-4">
        <Badge className="bg-background/90 text-foreground border-none text-[10px] tracking-widest uppercase gap-1"><Sparkles className="w-3 h-3 text-primary" />Sponsored</Badge>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-primary-foreground">
        <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-2 drop-shadow">{ad.title}</h3>
        {ad.description && <p className="text-sm md:text-base text-primary-foreground/85 max-w-xl mb-4 line-clamp-2">{ad.description}</p>}
        {href && (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-lg group-hover:gap-3 transition-all">
            {ad.cta_text || "Learn more"} <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
  if (!href) return inner;
  const isExternal = /^https?:\/\//.test(href);
  return isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>
  ) : (
    <Link to={href} className="block">{inner}</Link>
  );
};

const AdBanner = () => {
  const { t } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

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

  useEffect(() => {
    if (ads.length <= 2 || paused) return;
    const int = setInterval(() => setCurrent((c) => (c + 1) % ads.length), 5500);
    return () => clearInterval(int);
  }, [ads.length, paused]);

  if (ads.length === 0) return null;

  const Header = (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-1">{t("Featured Partners")}</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t("Curated for your wedding")}</h2>
      </div>
    </div>
  );

  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        {Header}

        {ads.length === 1 && <AdCard ad={ads[0]} size="lg" />}

        {ads.length === 2 && (
          <div className="grid md:grid-cols-2 gap-5">
            {ads.map((a) => <AdCard key={a.id} ad={a} size="md" />)}
          </div>
        )}

        {ads.length >= 3 && (
          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStart.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStart.current;
              if (Math.abs(dx) > 50) setCurrent((c) => (c + (dx < 0 ? 1 : -1) + ads.length) % ads.length);
              touchStart.current = null;
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={ads[current].id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5 }}
              >
                <AdCard ad={ads[current]} size="lg" />
              </motion.div>
            </AnimatePresence>

            <button
              onClick={() => setCurrent((c) => (c - 1 + ads.length) % ads.length)}
              aria-label="Previous ad"
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/95 border border-border shadow-md items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % ads.length)}
              aria-label="Next ad"
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/95 border border-border shadow-md items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex justify-center gap-2 mt-6">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to ad ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === current ? "w-10 bg-primary" : "w-4 bg-border hover:bg-primary/40"}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdBanner;
