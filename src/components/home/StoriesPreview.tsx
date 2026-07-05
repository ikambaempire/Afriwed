import { useEffect, useRef, useState, useCallback, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Calendar, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import storyFallbackImage from "@/assets/afriwedd-story-fallback.jpg";

type Post = {
  id: string; slug: string; title: string; excerpt: string | null;
  featured_image_url: string | null; published_at: string | null;
};

const PAGE_SIZE = 12;
const INITIAL = 13;

const HeroSkeleton = () => (
  <div className="grid lg:grid-cols-2 gap-8 mb-12">
    <div>
      <Skeleton className="aspect-[4/3] rounded-2xl mb-5" />
      <Skeleton className="h-8 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="space-y-5">
      {[0,1,2].map(i => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-32 h-24 sm:w-40 sm:h-28 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-1/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CardSkeleton = () => (
  <div>
    <Skeleton className="aspect-[4/3] rounded-xl mb-3" />
    <Skeleton className="h-5 w-5/6 mb-2" />
    <Skeleton className="h-3 w-1/3" />
  </div>
);

const useStoryFallback = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = storyFallbackImage;
};

const StoriesPreview = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { lang, t } = useLanguage();
  const isMobile = useIsMobile();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial load (resets on language change)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    supabase.from("blog_posts")
      .select("id, slug, title, excerpt, featured_image_url, published_at")
      .eq("status", "publish")
      .eq("language", lang)
      .order("published_at", { ascending: false })
      .range(0, INITIAL - 1)
      .then(({ data }) => {
        if (cancelled) return;
        const list = (data ?? []) as Post[];
        setPosts(list);
        setOffset(list.length);
        setHasMore(list.length === INITIAL);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [lang]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    const { data } = await supabase.from("blog_posts")
      .select("id, slug, title, excerpt, featured_image_url, published_at")
      .eq("status", "publish")
      .eq("language", lang)
      .order("published_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    const list = (data ?? []) as Post[];
    setPosts(prev => [...prev, ...list]);
    setOffset(prev => prev + list.length);
    setHasMore(list.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [offset, lang, hasMore, loading, loadingMore]);

  // Infinite scroll on mobile
  useEffect(() => {
    if (!isMobile || !sentinelRef.current || loading) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [isMobile, loadMore, loading]);

  if (loading) {
    return (
      <section className="py-20 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">{t("Afriwedd Editorial")}</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("Stories of African Love")}</h2>
            </div>
          </div>
          <HeroSkeleton />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-10 border-t border-border">
            {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;
  const [hero, ...rest] = posts;
  const mid = rest.slice(0, 3);
  const grid = rest.slice(3);

  return (
    <section className="py-20 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">{t("Afriwedd Editorial")}</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("Stories of African Love")}</h2>
          </div>
          <Link to="/stories" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
            {t("All stories")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Link to={`/stories/${hero.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl mb-5 bg-muted">
                <img src={hero.featured_image_url || storyFallbackImage} onError={useStoryFallback} alt={hero.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors">{hero.title}</h3>
              <p className="text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: (hero.excerpt || "").slice(0, 220) }} />
            </Link>
          </motion.div>

          <div className="space-y-5">
            {mid.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.35 }}>
                <Link to={`/stories/${p.slug}`} className="group flex gap-4">
                  <div className="w-32 h-24 sm:w-40 sm:h-28 overflow-hidden rounded-lg bg-muted shrink-0">
                    <img src={p.featured_image_url || storyFallbackImage} onError={useStoryFallback} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base md:text-lg font-semibold leading-snug line-clamp-3 group-hover:text-primary transition-colors">{p.title}</h3>
                    {p.published_at && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.published_at).toLocaleDateString()}</p>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-10 border-t border-border">
          <AnimatePresence initial={false}>
            {grid.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.03, duration: 0.35 }}
              >
                <Link to={`/stories/${p.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl mb-3 bg-muted">
                    <img src={p.featured_image_url || storyFallbackImage} onError={useStoryFallback} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                  {p.published_at && <p className="text-xs text-muted-foreground mt-1">{new Date(p.published_at).toLocaleDateString()}</p>}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {loadingMore && Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={`s-${i}`} />)}
        </div>

        {/* Mobile sentinel for infinite scroll */}
        {isMobile && hasMore && <div ref={sentinelRef} className="h-10" />}

        <div className="text-center mt-10 flex flex-col items-center gap-4">
          {!isMobile && hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("Loading…")}</> : <>{t("Load more stories")}</>}
            </button>
          )}
          {isMobile && loadingMore && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> {t("Loading…")}</span>
          )}
          <Link to="/stories" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {t("Browse all stories")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StoriesPreview;
