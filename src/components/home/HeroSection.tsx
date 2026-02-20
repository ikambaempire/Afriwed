import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-wedding.jpg";

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    {/* Background image */}
    <div className="absolute inset-0">
      <img
        src={heroImage}
        alt="Elegant wedding setup in Rwanda"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-hero" />
    </div>

    <div className="relative z-10 container mx-auto px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-primary-foreground/80 font-sans text-sm tracking-[0.2em] uppercase mb-4">
          Haruwa — Rwanda's Wedding Marketplace
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6">
          Plan Your Dream
          <br />
          <span className="text-gradient-gold">Wedding</span> in One Place
        </h1>
        <p className="text-primary-foreground/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
          Discover and book the best wedding vendors across Rwanda. From venues to photographers, we bring your vision to life.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base px-8 py-6 rounded-full bg-foreground text-background hover:bg-foreground/90">
            <Link to="/vendors">Find Vendors</Link>
          </Button>
          <Button asChild variant="hero-outline" size="lg" className="text-base px-8 py-6 rounded-full">
            <Link to="/planning">Plan My Wedding</Link>
          </Button>
          <Button asChild variant="hero-outline" size="lg" className="text-base px-8 py-6 rounded-full">
            <Link to="/auth?tab=vendor">List Your Business</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
