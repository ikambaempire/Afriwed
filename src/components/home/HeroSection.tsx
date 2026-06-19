import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-wedding.jpg";

const HeroSection = () => (
  <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroImage} alt="African wedding storytelling" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-hero" />
    </div>

    <div className="relative z-10 container mx-auto px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <p className="text-primary-foreground/80 font-sans text-sm tracking-[0.2em] uppercase mb-4">
          Afriwedd — The African Wedding Publishing Platform
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6">
          Stories, Real Weddings &
          <br />
          <span className="text-gradient-gold">Voices</span> from Across Africa
        </h1>
        <p className="text-primary-foreground/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
          Read, publish and celebrate African weddings. A modern editorial home for couples, creators and the vendors who bring it all to life.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="text-base px-10 py-6 rounded-full bg-foreground text-background hover:bg-foreground/90">
            <Link to="/stories">Read the latest stories</Link>
          </Button>
          <Button asChild size="lg" variant="hero-outline" className="text-base px-10 py-6 rounded-full">
            <Link to="/real-weddings">Explore Real Weddings</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
