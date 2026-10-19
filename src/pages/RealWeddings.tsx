import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, Calendar } from "lucide-react";

const COUNTRIES = ["All", "Rwanda", "Kenya", "Uganda", "Nigeria", "Ghana", "South Africa", "Tanzania", "Ethiopia"];
const TYPES = ["All", "Traditional", "Modern", "Luxury", "Cultural", "Destination"];

const RealWeddings = () => {
  const [items, setItems] = useState<any[]>([]);
  const [country, setCountry] = useState("All");
  const [type, setType] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("real_weddings").select("*").eq("status", "approved").order("created_at", { ascending: false });
      if (country !== "All") q = q.eq("country", country);
      if (type !== "All") q = q.eq("wedding_type", type.toLowerCase());
      const { data } = await q;
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [country, type]);

  return (
    <>
      <Helmet>
        <title>Real African Weddings — Afriwedd</title>
        <meta name="description" content="Browse beautiful real wedding stories from across Africa. Filter by country, style, and tradition." />
        <link rel="canonical" href="https://haruwa1.lovable.app/real-weddings" />
        <meta property="og:url" content="https://haruwa1.lovable.app/real-weddings" />
      </Helmet>
      <Header />
      <main className="pt-16">
        <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
          <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600" alt="African wedding celebration" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="relative z-10 text-center px-4">
            <p className="text-primary-foreground/80 text-sm tracking-[0.25em] uppercase mb-3">Real Weddings</p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-4">Love, Lived Out Loud</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">Authentic African wedding stories — the colours, the people, the vendors that made it.</p>
            <Button asChild size="lg" className="mt-8 rounded-full" variant="gold">
              <Link to="/submit?type=wedding">Submit Your Wedding</Link>
            </Button>
          </div>
        </section>

        <section className="border-b border-border bg-background sticky top-16 z-30">
          <div className="container mx-auto px-4 py-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2">Country:</span>
            {COUNTRIES.map(c => (
              <button key={c} onClick={() => setCountry(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${country === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{c}</button>
            ))}
            <span className="text-xs uppercase tracking-widest text-muted-foreground ml-4 mr-2">Type:</span>
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t}</button>
            ))}
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-12">Loading...</p>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="font-display text-2xl mb-3">No real weddings yet</h2>
                <p className="text-muted-foreground mb-6">Be the first couple to share your story.</p>
                <Button asChild><Link to="/submit?type=wedding">Submit Your Wedding</Link></Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((w, i) => (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }}>
                    <Link to={`/real-weddings/${w.slug}`} className="group block">
                      <div className="aspect-[4/5] overflow-hidden rounded-xl mb-4 bg-muted relative">
                        <img src={w.cover_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=600"} alt={w.couple_names} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        <div className="absolute top-3 left-3 bg-card/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium capitalize">{w.wedding_type}</div>
                      </div>
                      <h3 className="font-display text-xl font-semibold mb-1 group-hover:text-primary transition-colors">{w.couple_names}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {w.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{w.location}, {w.country}</span>}
                        {w.wedding_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(w.wedding_date).toLocaleDateString()}</span>}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default RealWeddings;
