import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Calendar } from "lucide-react";

const PAGE_SIZE = 12;
const BASE = "https://haruwa1.lovable.app";

const AuthorProfile = () => {
  const { slug } = useParams();
  const [author, setAuthor] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [featuredWeddings, setFeaturedWeddings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: a } = await (supabase as any).from("blog_authors").select("*").eq("slug", slug!).maybeSingle();
      setAuthor(a);
      if (a) {
        const ids: string[] = Array.isArray(a.featured_wedding_ids) ? a.featured_wedding_ids : [];
        if (ids.length) {
          const { data: ws } = await supabase.from("real_weddings").select("id, slug, couple_names, cover_image_url, wedding_type, location, country").in("id", ids).eq("status", "approved");
          setFeaturedWeddings(ws ?? []);
        } else setFeaturedWeddings([]);
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!author) return;
    (async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, featured_image_url, published_at", { count: "exact" })
        .eq("status", "publish")
        .eq("author_id", author.id)
        .order("published_at", { ascending: false })
        .range(from, to);
      setPosts(data ?? []);
      setTotal(count ?? 0);
    })();
  }, [author, page]);

  if (loading) return (<><Header /><main className="pt-24 container mx-auto px-4"><p>Loading...</p></main></>);
  if (!author) return (<><Header /><main className="pt-24 container mx-auto px-4 text-center"><h1 className="font-display text-3xl mb-4">Author not found</h1><Link to="/stories" className="text-primary">← Back to stories</Link></main></>);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canonical = `${BASE}/authors/${author.slug}`;

  return (
    <>
      <Helmet>
        <title>{author.display_name} — Author at Afriwedd</title>
        <meta name="description" content={(author.bio || `Stories by ${author.display_name} on Afriwedd.`).slice(0, 155)} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${author.display_name} — Author at Afriwedd`} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="profile" />
        {author.avatar_url && <meta property="og:image" content={author.avatar_url} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: author.display_name,
            description: author.bio,
            image: author.avatar_url,
            url: canonical,
          },
        })}</script>
      </Helmet>
      <Header />
      <main className="pt-20 pb-20 bg-background">
        <section className="bg-secondary/40 py-14 border-b border-border">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 ring-2 ring-primary/20">
              <AvatarImage src={author.avatar_url} alt={author.display_name} />
              <AvatarFallback className="text-2xl">{author.display_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-xs tracking-[0.25em] uppercase text-primary font-semibold mb-2">Afriwedd Author</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{author.display_name}</h1>
            {author.bio && <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">{author.bio}</p>}
            {author.social_links && typeof author.social_links === "object" && (
              <div className="flex justify-center flex-wrap gap-3 mt-5">
                {Object.entries(author.social_links as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                  <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors capitalize">
                    {k}
                  </a>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">{total} published {total === 1 ? "article" : "articles"}</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold mb-6">Articles</h2>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No published articles yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(p => (
                <Link key={p.id} to={`/stories/${p.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl mb-4 bg-muted">
                    <img src={p.featured_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=600"} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                  {p.published_at && <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.published_at).toLocaleDateString()}</p>}
                </Link>
              ))}
            </div>
          )}

          {pages > 1 && (
            <Pagination className="mt-12">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }} />
                </PaginationItem>
                {Array.from({ length: pages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>{i + 1}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.min(pages, p + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </section>

        {featuredWeddings.length > 0 && (
          <section className="container mx-auto px-4 py-12 border-t border-border">
            <h2 className="font-display text-2xl font-bold mb-6">Featured Real Weddings</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredWeddings.map(w => (
                <Link key={w.id} to={`/real-weddings/${w.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl mb-3 bg-muted">
                    <img src={w.cover_image_url} alt={w.couple_names} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <h3 className="font-display text-base font-semibold group-hover:text-primary">{w.couple_names}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{w.wedding_type} · {w.location}, {w.country}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="container mx-auto px-4 mt-12 text-center">
          <Button asChild variant="outline"><Link to="/stories">← All Stories</Link></Button>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AuthorProfile;
