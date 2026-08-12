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

import { formatArticle } from "@/lib/articleFormat";

// Normalise featured images to crawler-safe URLs (no webp/avif, capped size).
function shareImage(raw?: string | null): string | null {
  if (!raw) return null;
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//i.test(url)) return null;
  url = url.replace(/^http:\/\//i, "https://");
  const ext = (url.split("?")[0].split(".").pop() ?? "").toLowerCase();
  if (ext === "webp" || ext === "avif") {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//i, ""))}&w=1200&h=630&fit=cover&output=jpg&q=82`;
  }
  if (url.includes("/storage/v1/object/public/")) {
    const rendered = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${rendered}${rendered.includes("?") ? "&" : "?"}width=1200&height=630&resize=cover&format=origin`;
  }
  return url;
}

function firstArticleImage(html?: string | null): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}



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
          .select("id, post_id, author_name, content, approved, created_at, hidden, user_id").eq("post_id", p.id).eq("approved", true).order("created_at", { ascending: true });
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

  const socialImage = shareImage(post.featured_image_url || firstArticleImage(post.content_html));

  return (
    <>
      <Helmet>
        <title>{(post.meta_title || post.title)} — Afriwedd</title>
        <meta name="description" content={(post.meta_description || post.excerpt || "").replace(/<[^>]+>/g, "").slice(0, 155)} />
        {post.focus_keyword && <meta name="keywords" content={post.focus_keyword} />}
        <link rel="canonical" href={`https://afriwedd.lovable.app/stories/${post.slug}`} />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={(post.meta_description || post.excerpt || "").replace(/<[^>]+>/g, "").slice(0, 155)} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:url" content={`https://afriwedd.lovable.app/stories/${post.slug}`} />
        {socialImage && <meta property="og:image" content={socialImage} />}
        {socialImage && <meta property="og:image:secure_url" content={socialImage} />}
        {socialImage && <meta property="og:image:type" content="image/jpeg" />}
        {socialImage && <meta property="og:image:width" content="1200" />}
        {socialImage && <meta property="og:image:height" content="630" />}
        {socialImage && <meta name="twitter:image" content={socialImage} />}

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: (post.excerpt || "").replace(/<[^>]+>/g, "").slice(0, 200),
          datePublished: post.published_at,
          dateModified: post.updated_at || post.published_at,
          mainEntityOfPage: `https://afriwedd.lovable.app/stories/${post.slug}`,
          author: post.author ? {
            "@type": "Person",
            name: post.author.display_name,
            url: post.author.slug ? `https://afriwedd.lovable.app/authors/${post.author.slug}` : undefined,
          } : undefined,
          image: post.featured_image_url ? [post.featured_image_url] : undefined,
          publisher: { "@type": "Organization", name: "Afriwedd", url: "https://afriwedd.lovable.app" },
        })}</script>
      </Helmet>
      <Header />
      <main className="pt-24">
        <article>
          <div className="container mx-auto px-4 max-w-3xl">
            <Link to="/stories" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-5">
              <ArrowLeft className="w-4 h-4" /> All stories
            </Link>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-5 tracking-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
              {post.author && (
                post.author.slug
                  ? <Link to={`/authors/${post.author.slug}`} className="flex items-center gap-1 hover:text-primary"><User className="w-3 h-3" />{post.author.display_name}</Link>
                  : <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author.display_name}</span>
              )}
              {post.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>}
            </div>
          </div>

          {post.featured_image_url && (
            <div className="container mx-auto px-4 max-w-4xl mb-10">
              <div className="rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-auto max-h-[75vh] object-contain"
                />
              </div>
            </div>
          )}

          <div className="container mx-auto px-4 max-w-3xl relative z-10">
            <div
              className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-3 prose-p:text-foreground/85 prose-p:my-7 prose-p:leading-[1.95] prose-li:my-2 prose-ul:my-6 prose-ol:my-6 prose-blockquote:my-8 prose-a:text-primary prose-img:rounded-xl prose-img:my-8"
              dangerouslySetInnerHTML={{ __html: formatArticle(post.content_html || "") }}
            />

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
