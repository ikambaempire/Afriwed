import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type Post = {
  id: string; slug: string; title: string; excerpt: string | null;
  featured_image_url: string | null; published_at: string | null;
};

const StoriesPreview = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    supabase.from("blog_posts")
      .select("id, slug, title, excerpt, featured_image_url, published_at")
      .eq("status", "publish")
      .order("published_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setPosts((data ?? []) as Post[]));
  }, []);

  if (posts.length === 0) return null;
  const [hero, ...rest] = posts;

  return (
    <section className="py-20 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">Afriwedd Editorial</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Stories of African Love</h2>
          </div>
          <Link to="/stories" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
            All stories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Link to={`/stories/${hero.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl mb-5 bg-muted">
                <img src={hero.featured_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=900"} alt={hero.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors">{hero.title}</h3>
              <p className="text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: (hero.excerpt || "").slice(0, 200) }} />
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {rest.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 * (i + 1) }}>
                <Link to={`/stories/${p.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl mb-3 bg-muted">
                    <img src={p.featured_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=500"} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center sm:hidden mt-8">
          <Link to="/stories" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            All stories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StoriesPreview;
