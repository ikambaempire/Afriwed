import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoriesButton from "@/components/stories/CategoriesButton";
import AdBanner from "@/components/home/AdBanner";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, ArrowRight, Flame } from "lucide-react";
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
type Cat = { id: string; slug: string; name: string };

const FALLBACK = storyFallbackImage;
const onImgErr = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK;
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");

const HeadlineTicker = ({ posts }: { posts: Post[] }) => {
  const { t } = useLanguage();
  const items = posts.slice(0, 8);
  if (!items.length) return null;
  return (
    <div className="bg-primary text-primary-foreground border-y border-primary/40">
      <div className="container mx-auto px-4 py-2 flex items-center gap-4">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-widest uppercase shrink-0">
          <Flame className="w-3.5 h-3.5" /> {t("Trending")}
        </span>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-8 whitespace-nowrap animate-[marquee_60s_linear_infinite]">
            {[...items, ...items].map((p, i) => (
              <Link key={`${p.id}-${i}`} to={`/stories/${p.slug}`} className="text-sm hover:underline">
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StoryCard = ({ p, size = "md" }: { p: Post; size?: "sm" | "md" | "lg" }) => {
  const aspect = size === "lg" ? "aspect-[16/10]" : "aspect-[4/3]";
  const titleClass =
    size === "lg"
      ? "font-display text-2xl md:text-3xl font-bold leading-tight"
      : size === "sm"
      ? "font-display text-sm font-semibold leading-snug line-clamp-3"
      : "font-display text-base md:text-lg font-semibold leading-snug line-clamp-2";
  return (
    <Link to={`/stories/${p.slug}`} className="group block">
      <div className={`${aspect} overflow-hidden rounded-lg mb-3 bg-muted`}>
        <img
          src={p.featured_image_url || FALLBACK}
          onError={onImgErr}
          alt={p.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <h3 className={`${titleClass} text-foreground group-hover:text-primary transition-colors`}>{p.title}</h3>
      {size === "lg" && p.excerpt && (
        <p className="text-muted-foreground mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: p.excerpt.slice(0, 200) }} />
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
        {p.author?.display_name && (
          <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{p.author.display_name}</span>
        )}
        {p.published_at && (
          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(p.published_at)}</span>
        )}
      </div>
    </Link>
  );
};

const SideItem = ({ p }: { p: Post }) => (
  <Link to={`/stories/${p.slug}`} className="group flex gap-3 py-3 border-b border-border last:border-0">
    <div className="w-24 h-20 shrink-0 overflow-hidden rounded-md bg-muted">
      <img src={p.featured_image_url || FALLBACK} onError={onImgErr} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-display text-sm font-semibold leading-snug line-clamp-3 group-hover:text-primary transition-colors">{p.title}</h4>
      {p.published_at && <p className="text-[11px] text-muted-foreground mt-1">{fmtDate(p.published_at)}</p>}
    </div>
  </Link>
);

const Index = () => {
  const { lang, t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [byCat, setByCat] = useState<Record<string, Post[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("id, slug, title, excerpt, featured_image_url, published_at, author:blog_authors(display_name)")
          .eq("status", "publish")
          .eq("language", lang)
          .order("published_at", { ascending: false })
          .limit(80),
        supabase.from("blog_categories").select("id, slug, name").order("name"),
      ]);
      const list = ((p ?? []) as any) as Post[];
      const cList = (c ?? []) as Cat[];
      if (cancel) return;
      setPosts(list);
      setCats(cList);

      const ids = list.map((x) => x.id);
      if (ids.length) {
        const { data: rel } = await supabase
          .from("blog_post_categories")
          .select("post_id, category_id")
          .in("post_id", ids);
        const postMap = new Map(list.map((x) => [x.id, x]));
        const bucket: Record<string, Post[]> = {};
        (rel ?? []).forEach((r: any) => {
          const post = postMap.get(r.post_id);
          if (!post) return;
          if (!bucket[r.category_id]) bucket[r.category_id] = [];
          if (!bucket[r.category_id].some((x) => x.id === post.id)) bucket[r.category_id].push(post);
        });
        if (!cancel) setByCat(bucket);
      }
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, [lang]);

  const lead = posts[0];
  const sideTop = posts.slice(1, 5);
  const latest = posts.slice(5, 14);

  // Pick top 5 categories with the most posts
  const topCats = [...cats]
    .map((c) => ({ ...c, items: (byCat[c.id] || []).slice(0, 4) }))
    .filter((c) => c.items.length >= 3)
    .sort((a, b) => (byCat[b.id]?.length || 0) - (byCat[a.id]?.length || 0))
    .slice(0, 5);

  return (
    <>
      <Helmet>
        <title>Afriwedd — African Wedding Stories, Culture & Inspiration</title>
        <meta name="description" content="Afriwedd is Africa's premier wedding publishing platform: real weddings, culture, planning wisdom, and vendor stories from across the continent." />
        <link rel="canonical" href="https://afriwedd.lovable.app/" />
        <meta property="og:title" content="Afriwedd — African Wedding Stories & Culture" />
        <meta property="og:description" content="Real African weddings, cultural inspiration, and editorial features." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <style>{`@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
      <Header />
      <main className="pt-16 bg-background">
        {/* Categories bar (non-sticky) */}
        <section className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <CategoriesButton cats={cats} activeCat="all" />
            <Link to="/stories" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              {t("All stories")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Trending ticker */}
        <HeadlineTicker posts={posts} />

        {loading ? (
          <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 aspect-[16/10] rounded-lg" />
            <div className="space-y-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
          </div>
        ) : (
          <>
            {/* Lead + side headlines */}
            {lead && (
              <section className="py-8 md:py-10 border-b border-border">
                <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <StoryCard p={lead} size="lg" />
                  </div>
                  <div className="lg:border-l lg:border-border lg:pl-8">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-primary mb-2">{t("Top Stories")}</h3>
                    <div>{sideTop.map((p) => <SideItem key={p.id} p={p} />)}</div>
                  </div>
                </div>
              </section>
            )}

            {/* Latest news 3-column grid */}
            {latest.length > 0 && (
              <section className="py-10 border-b border-border">
                <div className="container mx-auto px-4">
                  <div className="flex items-baseline justify-between mb-6">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">
                      <span className="border-l-4 border-primary pl-3">{t("Latest Stories")}</span>
                    </h2>
                    <Link to="/stories" className="text-sm text-primary font-medium hover:underline">{t("See all")}</Link>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {latest.map((p) => <StoryCard key={p.id} p={p} />)}
                  </div>
                </div>
              </section>
            )}

            {/* Ad banner */}
            <div className="py-8 bg-secondary/40 border-b border-border">
              <div className="container mx-auto px-4">
                <AdBanner />
              </div>
            </div>

            {/* Category sections */}
            {topCats.map((c, idx) => (
              <section key={c.id} className="py-10 border-b border-border">
                <div className="container mx-auto px-4">
                  <div className="flex items-baseline justify-between mb-6">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">
                      <span className="border-l-4 border-primary pl-3">{c.name}</span>
                    </h2>
                    <Link to={`/stories?category=${c.slug}`} className="text-sm text-primary font-medium hover:underline">{t("See all")}</Link>
                  </div>
                  {idx % 2 === 0 ? (
                    <div className="grid lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">{c.items[0] && <StoryCard p={c.items[0]} size="lg" />}</div>
                      <div>{c.items.slice(1, 4).map((p) => <SideItem key={p.id} p={p} />)}</div>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {c.items.map((p) => <StoryCard key={p.id} p={p} />)}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Index;
