import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";

const RealWeddingsPreview = () => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("real_weddings").select("id, slug, couple_names, cover_image_url, wedding_type, location, country")
      .eq("status", "approved")
      .order("created_at", { ascending: false }).limit(4)
      .then(({ data }) => setItems(data ?? []));
  }, []);
  if (items.length === 0) return null;
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-2">Real Weddings</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">Love, Lived Out Loud</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mt-3">Authentic African wedding stories — the colours, the people, the vendors that made it.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={`/real-weddings/${w.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-xl mb-3 bg-muted relative">
                  <img src={w.cover_image_url} alt={w.couple_names} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-3 left-3 bg-card/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-medium capitalize">{w.wedding_type}</div>
                </div>
                <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">{w.couple_names}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{w.location}, {w.country}</p>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/real-weddings" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
            Browse all real weddings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RealWeddingsPreview;
