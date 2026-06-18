import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

type Post = {
  id: string; slug: string; title: string; excerpt: string | null;
  featured_image_url: string | null; published_at: string | null;
  author: { display_name: string; slug: string | null } | null;
};

const EditorialFeature = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { lang } = useLanguage();

  useEffect(() => {
    supabase.from("blog_posts")
      .select("id, slug, title, excerpt, featured_image_url, published_at, author:blog_authors(display_name, slug)")
      .eq("status", "publish")
      .eq("language", lang)
      .order("published_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setPosts((data ?? []) as any));
  }, [lang]);

  if (posts.length === 0) return null;
  const [lead, ...rest] = posts;
  const side = rest.slice(0, 4);

  return (
    <section className="py-16 md:py-24 bg-background border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10 border-b border-border pb-5">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-2">The Afriwedd Edit</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">From the Editorial Desk</h2>
          </div>
          <Link to="/stories" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
            All articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-3">
            <Link to={`/stories/${lead.slug}`} className="group block">
              <div className="aspect-[16/10] overflow-hidden rounded-2xl mb-6 bg-muted">
                <img src={lead.featured_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200"} alt={lead.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <p className="text-xs tracking-widest uppercase text-primary font-semibold mb-3">Lead Story</p>
              <h3 className="font-display text-2xl md:text-4xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">{lead.title}</h3>
              <p className="text-muted-foreground text-base md:text-lg line-clamp-3" dangerouslySetInnerHTML={{ __html: (lead.excerpt || "").slice(0, 240) }} />
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                {lead.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{lead.author.display_name}</span>}
                {lead.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(lead.published_at).toLocaleDateString()}</span>}
              </div>
            </Link>
          </motion.article>

          <div className="lg:col-span-2 divide-y divide-border">
            {side.map((p, i) => (
              <motion.article key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 * i }} className="py-5 first:pt-0 last:pb-0">
                <Link to={`/stories/${p.slug}`} className="group flex gap-4">
                  <div className="w-24 h-24 overflow-hidden rounded-lg bg-muted shrink-0">
                    <img src={p.featured_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=300"} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-base font-semibold leading-snug line-clamp-3 group-hover:text-primary transition-colors">{p.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{p.author?.display_name}{p.published_at ? ` · ${new Date(p.published_at).toLocaleDateString()}` : ""}</p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialFeature;
