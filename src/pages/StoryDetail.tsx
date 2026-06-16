import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, User, ArrowLeft } from "lucide-react";

const StoryDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("blog_posts")
        .select("*, author:blog_authors(display_name, bio, avatar_url, slug)")
        .eq("slug", slug!)
        .eq("status", "publish")
        .maybeSingle();
      setPost(p);
      if (p) {
        const { data: rel } = await supabase.from("blog_post_categories").select("category_id").eq("post_id", p.id);
        const catIds = (rel ?? []).map(r => r.category_id);
        if (catIds.length) {
          const { data: relPosts } = await supabase.from("blog_post_categories")
            .select("post_id").in("category_id", catIds).neq("post_id", p.id).limit(20);
          const ids = Array.from(new Set((relPosts ?? []).map(r => r.post_id))).slice(0, 3);
          if (ids.length) {
            const { data: rp } = await supabase.from("blog_posts")
              .select("id, slug, title, featured_image_url").in("id", ids).eq("status", "publish");
            setRelated(rp ?? []);
          }
        }
        const { data: cms } = await supabase.from("blog_comments")
          .select("*").eq("post_id", p.id).eq("approved", true).order("created_at", { ascending: true });
        setComments(cms ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  const submitComment = async () => {
    if (!user) { toast.error("Sign in to comment"); return; }
    if (!newComment.trim()) return;
    const { error } = await supabase.from("blog_comments").insert({
      post_id: post.id,
      user_id: user.id,
      author_name: user.email?.split("@")[0] ?? "User",
      author_email: user.email,
      content: newComment,
      approved: false,
    });
    if (error) toast.error(error.message);
    else { toast.success("Comment submitted for review"); setNewComment(""); }
  };

  if (loading) return (<><Header /><main className="pt-24 container mx-auto px-4"><p className="text-muted-foreground">Loading…</p></main></>);
  if (!post) return (<><Header /><main className="pt-24 container mx-auto px-4 text-center"><h1 className="font-display text-3xl mb-4">Story not found</h1><Link to="/stories" className="text-primary">← Back to stories</Link></main></>);

  return (
    <>
      <Helmet>
        <title>{post.title} — Afriwedd</title>
        <meta name="description" content={(post.excerpt || "").replace(/<[^>]+>/g, "").slice(0, 155)} />
        <link rel="canonical" href={`https://haruwa1.lovable.app/stories/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://haruwa1.lovable.app/stories/${post.slug}`} />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: (post.excerpt || "").replace(/<[^>]+>/g, "").slice(0, 200),
          datePublished: post.published_at,
          dateModified: post.updated_at || post.published_at,
          mainEntityOfPage: `https://haruwa1.lovable.app/stories/${post.slug}`,
          author: post.author ? {
            "@type": "Person",
            name: post.author.display_name,
            url: post.author.slug ? `https://haruwa1.lovable.app/authors/${post.author.slug}` : undefined,
          } : undefined,
          image: post.featured_image_url ? [post.featured_image_url] : undefined,
          publisher: { "@type": "Organization", name: "Afriwedd", url: "https://haruwa1.lovable.app" },
        })}</script>
      </Helmet>
      <Header />
      <main className="pt-20">
        <article>
          {post.featured_image_url && (
            <div className="w-full h-[60vh] max-h-[600px] relative overflow-hidden">
              <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
          )}
          <div className="container mx-auto px-4 max-w-3xl -mt-32 relative z-10">
            <Link to="/stories" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
              <ArrowLeft className="w-4 h-4" /> All stories
            </Link>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight mb-6">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
              {post.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author.display_name}</span>}
              {post.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>}
            </div>
            <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/85 prose-a:text-primary prose-img:rounded-xl" dangerouslySetInnerHTML={{ __html: post.content_html || "" }} />

            <section className="mt-16 pt-10 border-t border-border">
              <h2 className="font-display text-2xl font-bold mb-6">Comments ({comments.length})</h2>
              {user ? (
                <div className="mb-8 space-y-3">
                  <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share your thoughts..." rows={3} />
                  <Button onClick={submitComment}>Post comment</Button>
                </div>
              ) : (
                <p className="mb-8 text-sm text-muted-foreground">
                  <Link to="/auth" className="text-primary">Sign in</Link> to leave a comment.
                </p>
              )}
              <div className="space-y-6">
                {comments.map(c => (
                  <div key={c.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <strong className="text-sm text-foreground">{c.author_name}</strong>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{c.content.replace(/<[^>]+>/g, "")}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-sm text-muted-foreground">Be the first to comment.</p>}
              </div>
            </section>

            {related.length > 0 && (
              <section className="mt-16 pt-10 border-t border-border">
                <h2 className="font-display text-2xl font-bold mb-6">Related stories</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {related.map(r => (
                    <Link key={r.id} to={`/stories/${r.slug}`} className="group">
                      <div className="aspect-[4/3] overflow-hidden rounded-xl mb-3 bg-muted">
                        <img src={r.featured_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=400"} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      </div>
                      <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary transition-colors">{r.title}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
        <div className="h-20" />
      </main>
      <Footer />
    </>
  );
};

export default StoryDetail;
