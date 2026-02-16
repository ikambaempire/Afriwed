import { Star } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Diane & Jean-Pierre",
    text: "Royal Knot made our wedding planning so effortless. We found our venue, photographer, and caterer all in one afternoon!",
    rating: 5,
  },
  {
    name: "Claudine & Emmanuel",
    text: "The vendor quality is incredible. Every professional we booked through the platform exceeded our expectations.",
    rating: 5,
  },
  {
    name: "Grace & Patrick",
    text: "From Kigali to Musanze, we found vendors across Rwanda. The secure payment feature gave us peace of mind.",
    rating: 5,
  },
];

const TestimonialsSection = () => (
  <section className="py-20 bg-muted">
    <div className="container mx-auto px-4">
      <div className="text-center mb-14">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">Love Stories</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Happy Couples
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            className="bg-card p-6 rounded-xl shadow-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-4 h-4 text-gold fill-gold" />
              ))}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 italic">
              "{t.text}"
            </p>
            <p className="font-display font-semibold text-foreground text-sm">{t.name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
