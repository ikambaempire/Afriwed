import { useEffect, useState, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, User, Flame } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import storyFallbackImage from "@/assets/afriwedd-story-fallback.jpg";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  author?: { display_name: string } | null;
};

const onImgErr = (e: SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = storyFallbackImage;
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

// Positions relative to the active card: -2, -1, 0, 1, 2
const POS = {
  "-2": { x: "-58%", y: 28, rotate: -14, scale: 0.72, zIndex: 1, opacity: 0.55, blur: 3 },
  "-1": { x: "-30%", y: 12, rotate: -7, scale: 0.85, zIndex: 2, opacity: 0.85, blur: 1 },
  "0":  { x: "0%",   y: 0,  rotate: 0,  scale: 1,    zIndex: 5, opacity: 1,    blur: 0 },
  "1":  { x: "30%",  y: 12, rotate: 7,  scale: 0.85, zIndex: 2, opacity: 0.85, blur: 1 },
  "2":  { x: "58%",  y: 28, rotate: 14, scale: 0.72, zIndex: 1, opacity: 0.55, blur: 3 },
} as const;

const TopStoriesCarousel = ({ posts }: { posts: Post[] }) => {
  const { t } = useLanguage();
  const items = posts.slice(0, 7);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  if (!items.length) return null;

  const go = (dir: number) => setActive((i) => (i + dir + items.length) % items.length);
  const featured = items[active];

  const relPos = (i: number) => {
    const n = items.length;
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <section
      className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[80%] h-[420px] rounded-full bg-primary/20 blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 pt-12 md:pt-16 pb-10 md:pb-14">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase font-bold text-primary mb-2">
              <Flame className="w-3.5 h-3.5" /> {t("Top Stories")}
            </p>
            <h2 className="font-display text-xl md:text-2xl font-bold leading-tight">
              {t("This week's most-read")}
            </h2>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => go(-1)}
              aria-label="Previous story"
              className="w-11 h-11 rounded-full border border-border bg-background/80 backdrop-blur hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next story"
              className="w-11 h-11 rounded-full border border-border bg-background/80 backdrop-blur hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* caption moved to overlay on active card */}

        {/* Fanned card deck */}
        <div
          className="relative mx-auto"
          style={{ perspective: "1400px", height: "clamp(360px, 46vw, 520px)" }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {items.map((p, i) => {
              const d = relPos(i);
              const key = String(Math.max(-2, Math.min(2, d))) as keyof typeof POS;
              const cfg = POS[key];
              const isActive = d === 0;
              const hidden = Math.abs(d) > 2;
              return (
                <motion.div
                  key={p.id}
                  className="absolute top-0"
                  style={{ zIndex: cfg.zIndex, transformStyle: "preserve-3d" }}
                  initial={false}
                  animate={{
                    x: cfg.x,
                    y: cfg.y,
                    rotate: cfg.rotate,
                    scale: cfg.scale,
                    opacity: hidden ? 0 : cfg.opacity,
                    filter: `blur(${cfg.blur}px)`,
                  }}
                  transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 1.2 }}
                  onClick={() => !isActive && setActive(i)}
                >
                  <div
                    className={`relative w-[240px] sm:w-[280px] md:w-[340px] lg:w-[380px] aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-2xl border border-border/60 ${
                      !isActive ? "cursor-pointer" : ""
                    }`}
                  >
                    {isActive ? (
                      <Link to={`/stories/${p.slug}`} className="block w-full h-full group">
                        <CardMedia post={p} />
                      </Link>
                    ) : (
                      <CardMedia post={p} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to story ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-8 bg-primary" : "w-2 bg-border hover:bg-primary/40"
              }`}
            />
          ))}
        </div>

        {/* Mobile arrows */}
        <div className="flex md:hidden justify-center gap-3 mt-5">
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next"
            className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

const CardMedia = ({ post }: { post: Post }) => (
  <>
    <img
      src={post.featured_image_url || storyFallbackImage}
      onError={onImgErr}
      alt={post.title}
      className="w-full h-full object-cover"
      loading="lazy"
      draggable={false}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
      <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-bold text-primary-foreground bg-primary/90 rounded-full px-2.5 py-1 mb-3">
        <Flame className="w-3 h-3" /> Top
      </span>
      <h4 className="font-display text-base md:text-lg font-semibold text-primary-foreground leading-snug line-clamp-4 drop-shadow">
        {post.title}
      </h4>
      {post.excerpt && (
        <p
          className="hidden md:block mt-2 text-xs text-white/85 line-clamp-3 max-w-[85%]"
          dangerouslySetInnerHTML={{ __html: post.excerpt.slice(0, 140) }}
        />
      )}
    </div>
  </>
);

export default TopStoriesCarousel;
