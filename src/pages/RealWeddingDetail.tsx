import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, Calendar, ArrowLeft } from "lucide-react";

const RealWeddingDetail = () => {
  const { slug } = useParams();
  const [w, setW] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("real_weddings").select("*").eq("slug", slug!).eq("status", "approved").maybeSingle();
      setW(data);
      if (data?.vendor_ids?.length) {
        const { data: vs } = await supabase.from("vendors").select("id, business_name, category, cover_image_url").in("id", data.vendor_ids);
        setVendors(vs ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return (<><Header /><main className="pt-24 container mx-auto px-4"><p>Loading...</p></main></>);
  if (!w) return (<><Header /><main className="pt-24 container mx-auto px-4 text-center"><h1 className="font-display text-3xl mb-4">Wedding not found</h1><Link to="/real-weddings" className="text-primary">← Browse all</Link></main></>);

  const gallery: string[] = Array.isArray(w.gallery_urls) ? w.gallery_urls : [];

  return (
    <>
      <Helmet>
        <title>{w.couple_names} — Real Wedding | Afriwedd</title>
        <meta name="description" content={(w.story || "").slice(0, 155)} />
        <link rel="canonical" href={`/real-weddings/${w.slug}`} />
      </Helmet>
      <Header />
      <main className="pt-16">
        {w.cover_image_url && (
          <div className="w-full h-[70vh] relative overflow-hidden">
            <img src={w.cover_image_url} alt={w.couple_names} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute bottom-12 left-0 right-0 text-center px-4">
              <p className="text-primary-foreground/80 text-xs tracking-[0.3em] uppercase mb-3">{w.wedding_type} Wedding</p>
              <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground">{w.couple_names}</h1>
              <div className="flex items-center justify-center gap-4 text-sm text-primary-foreground/80 mt-4">
                {w.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{w.location}, {w.country}</span>}
                {w.wedding_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(w.wedding_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>}
              </div>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 max-w-3xl py-16">
          <Link to="/real-weddings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="w-4 h-4" /> All real weddings
          </Link>
          {w.story && (
            <div className="prose prose-lg max-w-none mb-12 prose-p:text-foreground/85">
              {w.story.split("\n").map((p: string, i: number) => p.trim() && <p key={i}>{p}</p>)}
            </div>
          )}
          {gallery.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display text-2xl font-bold mb-6">Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg bg-muted">
                    <img src={url} alt={`${w.couple_names} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                  </a>
                ))}
              </div>
            </section>
          )}
          {vendors.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold mb-6">Featured Vendors</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {vendors.map(v => (
                  <Link key={v.id} to={`/vendor/${v.id}`} className="flex gap-3 bg-card rounded-xl p-3 border border-border hover:shadow-card-hover transition-shadow">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      {v.cover_image_url && <img src={v.cover_image_url} alt={v.business_name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{v.business_name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{v.category?.replace(/_/g, " ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default RealWeddingDetail;
