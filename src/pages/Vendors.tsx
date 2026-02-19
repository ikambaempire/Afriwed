import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const categoryLabels: Record<string, string> = {
  venues: "Venues",
  photographers: "Photographers",
  videographers: "Videographers",
  decorators: "Decorators",
  catering: "Catering",
  makeup_artists: "Makeup Artists",
  mc_entertainment: "MC & Entertainment",
  car_hire: "Car Hire",
  sound_lighting: "Sound & Lighting",
  wedding_planners: "Wedding Planners",
};

const categories = ["All", ...Object.values(categoryLabels)];

const defaultImages: Record<string, string> = {
  venues: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop",
  photographers: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=300&fit=crop",
  catering: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop",
  decorators: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&h=300&fit=crop",
  makeup_artists: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop",
  sound_lighting: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop",
  car_hire: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=400&h=300&fit=crop",
  mc_entertainment: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
  videographers: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&h=300&fit=crop",
  wedding_planners: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop",
};

const Vendors = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_approved", true)
        .order("rating", { ascending: false });
      setVendors(data ?? []);
      setLoading(false);
    };
    fetchVendors();
  }, []);

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.business_name.toLowerCase().includes(search.toLowerCase()) ||
      (v.location || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || categoryLabels[v.category] === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="bg-gradient-teal py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Find Your Perfect Vendors
            </h1>
            <div className="max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors or locations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-card h-12 rounded-full border-none"
                />
              </div>
              <Button size="icon" variant="gold" className="h-12 w-12 rounded-full">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 bg-background">
          <div className="container mx-auto px-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-12">Loading vendors...</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-6">{filtered.length} vendors found</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filtered.map((v, i) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/vendor/${v.id}`}
                        className="group block bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={v.cover_image_url || defaultImages[v.category] || defaultImages.venues}
                            alt={v.business_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <span className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full text-foreground">
                            {categoryLabels[v.category] || v.category}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-display font-semibold text-foreground mb-1">{v.business_name}</h3>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
                            <MapPin className="w-3 h-3" /> {v.location || "Rwanda"}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-gold fill-gold" />
                              <span className="text-sm font-semibold text-foreground">{v.rating || 0}</span>
                              <span className="text-xs text-muted-foreground">({v.review_count || 0})</span>
                            </div>
                            {v.starting_price > 0 && (
                              <span className="text-sm font-semibold text-primary">
                                From {v.starting_price.toLocaleString()} RWF
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">No vendors found matching your criteria.</p>
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

export default Vendors;
