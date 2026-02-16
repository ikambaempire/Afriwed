import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Camera, Video, Palette, UtensilsCrossed,
  Sparkles, Mic, Car, Speaker, CalendarHeart,
} from "lucide-react";

const categories = [
  { name: "Venues", icon: Building2 },
  { name: "Photographers", icon: Camera },
  { name: "Videographers", icon: Video },
  { name: "Decorators", icon: Palette },
  { name: "Catering", icon: UtensilsCrossed },
  { name: "Makeup Artists", icon: Sparkles },
  { name: "MC & Entertainment", icon: Mic },
  { name: "Car Hire", icon: Car },
  { name: "Sound & Lighting", icon: Speaker },
  { name: "Wedding Planners", icon: CalendarHeart },
];

const CategoriesSection = () => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="text-center mb-14">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">Browse</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Vendor Categories
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={`/vendors?category=${cat.name}`}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-full bg-teal-light flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <cat.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <span className="text-sm font-medium text-foreground text-center">{cat.name}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default CategoriesSection;
