import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Star, MapPin, MessageCircle, Calendar, Check, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";

const vendorData: Record<string, {
  name: string; category: string; location: string; rating: number; reviews: number;
  about: string; coverImage: string; services: { name: string; price: string; description: string }[];
  gallery: string[];
}> = {
  "1": {
    name: "Serena Kigali Garden",
    category: "Venues",
    location: "Kigali, Rwanda",
    rating: 4.9,
    reviews: 87,
    about: "Serena Kigali Garden is one of Rwanda's most prestigious wedding venues, offering breathtaking outdoor and indoor event spaces surrounded by lush tropical gardens. With a capacity of up to 500 guests, our venue provides world-class catering, impeccable service, and a magical atmosphere for your special day.",
    coverImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=500&fit=crop",
    services: [
      { name: "Silver Package", price: "500,000 RWF", description: "Venue rental, basic decoration, 100 guests" },
      { name: "Gold Package", price: "1,200,000 RWF", description: "Full venue, premium décor, catering for 200 guests" },
      { name: "Platinum Package", price: "2,500,000 RWF", description: "All-inclusive, 500 guests, live entertainment" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop",
    ],
  },
};

const fallback = vendorData["1"];

const reviewsData = [
  { name: "Diane M.", rating: 5, text: "Absolutely stunning venue. The gardens were breathtaking and the staff was incredibly professional.", date: "2 weeks ago" },
  { name: "Jean-Pierre K.", rating: 5, text: "Our wedding was magical thanks to this venue. Everything was perfect from start to finish.", date: "1 month ago" },
  { name: "Grace N.", rating: 4, text: "Beautiful location with great service. Would highly recommend for any wedding.", date: "2 months ago" },
];

const VendorProfile = () => {
  const { id } = useParams();
  const vendor = vendorData[id || "1"] || fallback;

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Cover */}
        <div className="relative h-64 md:h-80">
          <img src={vendor.coverImage} alt={vendor.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        </div>

        <div className="container mx-auto px-4">
          {/* Info header */}
          <motion.div
            className="relative -mt-16 bg-card rounded-xl shadow-card p-6 md:p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-primary bg-teal-light px-3 py-1 rounded-full">
                  {vendor.category}
                </span>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-3">{vendor.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {vendor.location}</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-gold fill-gold" /> {vendor.rating} ({vendor.reviews} reviews)
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-full gap-2">
                  <MessageCircle className="w-4 h-4" /> Chat
                </Button>
                <Button variant="hero" className="rounded-full gap-2">
                  <Calendar className="w-4 h-4" /> Book Now
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 pb-16">
            {/* Left content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed">{vendor.about}</p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[
                    { icon: Clock, label: "Response Time", value: "< 2 hours" },
                    { icon: Users, label: "Capacity", value: "Up to 500" },
                    { icon: Check, label: "Verified", value: "Since 2020" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-muted p-4 rounded-lg text-center">
                      <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Packages */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Packages & Pricing</h2>
                <div className="space-y-4">
                  {vendor.services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                      <div>
                        <h3 className="font-semibold text-foreground">{s.name}</h3>
                        <p className="text-sm text-muted-foreground">{s.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-primary">{s.price}</p>
                        <Button size="sm" variant="outline" className="mt-1 rounded-full text-xs">Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Gallery */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {vendor.gallery.map((img, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden">
                      <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Reviews */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviewsData.map((r, i) => (
                    <div key={i} className="p-4 bg-card border border-border rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {r.name[0]}
                          </div>
                          <span className="font-semibold text-sm text-foreground">{r.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: r.rating }).map((_, j) => (
                          <Star key={j} className="w-3 h-3 text-gold fill-gold" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{r.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sticky sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-6 shadow-card">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Quick Booking</h3>
                <p className="text-sm text-muted-foreground mb-4">Select a date and package to get started.</p>
                <div className="space-y-3">
                  <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground">
                    {vendor.services.map((s) => (
                      <option key={s.name}>{s.name} – {s.price}</option>
                    ))}
                  </select>
                  <Button className="w-full rounded-full" variant="hero">
                    Request Booking
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">You won't be charged yet</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default VendorProfile;
