import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const vendors = [
  {
    id: "1",
    name: "Serena Kigali Garden",
    category: "Venues",
    location: "Kigali",
    rating: 4.9,
    reviews: 87,
    startingPrice: "500,000",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Mugisha Photography",
    category: "Photographers",
    location: "Kigali",
    rating: 4.8,
    reviews: 124,
    startingPrice: "300,000",
    image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Amahoro Catering",
    category: "Catering",
    location: "Musanze",
    rating: 4.7,
    reviews: 56,
    startingPrice: "200,000",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    name: "Belle Déco Rwanda",
    category: "Decorators",
    location: "Kigali",
    rating: 4.9,
    reviews: 93,
    startingPrice: "400,000",
    image: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&h=300&fit=crop",
  },
];

const FeaturedVendors = () => (
  <section className="py-20 bg-muted">
    <div className="container mx-auto px-4">
      <div className="text-center mb-14">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">Top Rated</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Featured Vendors
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {vendors.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={`/vendor/${v.id}`}
              className="group block bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={v.image}
                  alt={v.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full text-foreground">
                  {v.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-foreground mb-1">{v.name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                  <MapPin className="w-3 h-3" />
                  {v.location}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-gold fill-gold" />
                    <span className="text-sm font-semibold text-foreground">{v.rating}</span>
                    <span className="text-xs text-muted-foreground">({v.reviews})</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    From {v.startingPrice} RWF
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Button asChild variant="outline" size="lg" className="rounded-full">
          <Link to="/vendors">View All Vendors</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default FeaturedVendors;
