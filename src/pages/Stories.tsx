import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search, Calendar, User } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

type Post = {
  id: string; slug: string; title: string; excerpt: string;
  featured_image_url: string | null; published_at: string | null;
  author: { display_name: string } | null;
};
type Cat = { id: string; slug: string; name: string };

const Stories = () => {
  const [params, setParams] = useSearchParams();
  const { lang } = useLanguage();
  const activeCat = params.get("category") || "all";
  const q = params.get("q") || "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [featured, setFeatured] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("blog_categories").select("id, slug, name").order("name");
      setCats(c ?? []);

      let postIds: string[] | null = null;
      if (activeCat !== "all") {
        const cat = (c ?? []).find(x => x.slug === activeCat);
        if (cat) {
          const { data: rel } = await supabase.from("blog_post_categories").select("post_id").eq("category_id", cat.id);
          postIds = (rel ?? []).map(r => r.post_id);
        }
      }

      let query = supabase.from("blog_posts")
        .select("id, slug, title, excerpt, featured_image_url, published_at, author:blog_authors(display_name)")
        .eq("status", "publish")
        .eq("language", lang)
        .order("published_at", { ascending: false })
        .limit(60);
      if (postIds) query = query.in("id", postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"]);
      if (q) query = query.ilike("title", `%${q}%`);
      const { data } = await query;
      const list = (data ?? []) as any as Post[];
      setFeatured(list[0] ?? null);
      setPosts(list.slice(1));
      setLoading(false);
    })();
  }, [activeCat, q, lang]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(params);
    if (search) p.set("q", search); else p.delete("q");
    setParams(p);
  };

  return (
    <>
      <Helmet>
        <title>Stories & Editorial — Afriwedd | Haruwa</title>
        <meta name="description" content="Real African wedding stories, cultural inspiration, planning guides, and editorial coverage from across the continent." />
        <link rel="canonical" href="https://haruwa1.lovable.app/stories" />
        <meta property="og:url" content="https://haruwa1.lovable.app/stories" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "Blog",
          name: "Afriwedd Editorial", url: "https://haruwa1.lovable.app/stories",
        })}</script>
      </Helmet>
      <Header />
      <main className="pt-16">
        <section className="bg-gradient-teal py-20">
          <div className="container mx-auto px-4 text-center">
            <p className="text-primary-foreground/80 text-sm tracking-[0.25em] uppercase mb-3">Afriwedd Editorial</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Stories of Love, Culture & Celebration</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">Real African weddings, vendor spotlights, and planning wisdom — straight from the continent.</p>
            <form onSubmit={onSearch} className="max-w-xl mx-auto mt-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stories..." className="pl-11 h-12 rounded-full bg-card border-none" />
            </form>
          </div>
        </section>

        <section className="border-b border-border bg-background sticky top-16 z-30">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
              <Link to="/stories" className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${activeCat === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>All</Link>
              {cats.map(c => (
                <Link key={c.id} to={`/stories?category=${c.slug}`} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${activeCat === c.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{c.name}</Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            {loading ? (
              <p className="text-center py-12 text-muted-foreground">Loading stories...</p>
            ) : (
              <>
                {featured && (
                  <Link to={`/stories/${featured.slug}`} className="group block mb-12">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
                        <img src={featured.featured_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=900"} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      </div>
                      <div>
                        <span className="text-primary text-sm font-semibold tracking-widest uppercase">Featured Story</span>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4 leading-tight group-hover:text-primary transition-colors">{featured.title}</h2>
                        <p className="text-muted-foreground mb-4 line-clamp-3" dangerouslySetInnerHTML={{ __html: featured.excerpt || "" }} />
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {featured.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{featured.author.display_name}</span>}
                          {featured.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(featured.published_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }}>
                      <Link to={`/stories/${p.slug}`} className="group block">
                        <div className="aspect-[4/3] overflow-hidden rounded-xl mb-4 bg-muted">
                          <img src={p.featured_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=600"} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        </div>
                        <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug line-clamp-2">{p.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {p.author && <span>{p.author.display_name}</span>}
                          {p.published_at && <><span>·</span><span>{new Date(p.published_at).toLocaleDateString()}</span></>}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                {posts.length === 0 && !featured && (
                  <p className="text-center py-12 text-muted-foreground">No stories found.</p>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Stories;
