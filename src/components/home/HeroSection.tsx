import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, BookOpen, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import heroImage from "@/assets/hero-wedding.jpg";

type Slide = {
  eyebrow: string;
  title: string;
  gold: string;
  body: string;
  image: string;
  tag: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Issue No. 24 · This week's dispatch",
    title: "African wedding stories,",
    gold: "delivered weekly.",
    body: "A curated newsletter of real weddings, essays and craft from across the continent — read online or in your inbox every Sunday.",
    image: heroImage,
    tag: "Newsletter",
  },
  {
    eyebrow: "Editors' pick",
    title: "The people behind the",
    gold: "aisle.",
    body: "Portraits, love letters and long-form profiles of the couples, planners and creatives shaping modern African weddings.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    tag: "Feature",
  },
  {
    eyebrow: "Ubwoba & Ubwiza",
    title: "Stories in English",
    gold: "& Kinyarwanda.",
    body: "Switch languages in a tap. Every essay, wedding and vendor guide is published in the voice of its authors.",
    image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&q=80",
    tag: "Bilingual",
  },
];

const HeroSection = () => {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [email, setEmail] = useState("");
  const slide = SLIDES[index];

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#0e0b08]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img src={slide.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/85" />
        </motion.div>
      </AnimatePresence>

      {/* Newsletter masthead */}
      <div className="absolute top-20 left-0 right-0 z-20">
        <div className="container mx-auto px-4 flex items-center justify-between text-primary-foreground/80 text-[11px] tracking-[0.3em] uppercase">
          <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-gradient-gold" />The Afriwedd Weekly</span>
          <span className="hidden sm:inline">Vol. II · {new Date().getFullYear()}</span>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/5 backdrop-blur px-3 py-1 text-[11px] tracking-widest uppercase text-primary-foreground/85 mb-5">
              <BookOpen className="w-3.5 h-3.5" /> {slide.tag}
            </span>
            <p className="text-primary-foreground/70 font-sans text-xs md:text-sm tracking-[0.2em] uppercase mb-4">{slide.eyebrow}</p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[1.05] mb-6">
              {slide.title}
              <br />
              <span className="text-gradient-gold italic font-medium">{slide.gold}</span>
            </h1>
            <p className="text-primary-foreground/75 text-base md:text-lg max-w-xl mb-8 font-light leading-relaxed">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Newsletter subscribe card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-background/95 backdrop-blur rounded-2xl p-6 md:p-8 shadow-2xl border border-primary-foreground/10 max-w-md w-full lg:justify-self-end"
        >
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-primary" />
            <p className="text-xs tracking-[0.25em] uppercase text-primary font-semibold">Subscribe · Free</p>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-2">
            Get the Sunday edition
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            One beautifully-designed email. Real weddings, essays and vendor picks — no spam, unsubscribe any time.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (email) window.location.href = `/auth?email=${encodeURIComponent(email)}`; }}
            className="flex flex-col sm:flex-row gap-2 mb-3"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" className="rounded-full px-5">Subscribe <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </form>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full flex-1">
              <Link to="/stories">Read latest issue</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full flex-1">
              <Link to="/author-apply">Write for us</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Carousel controls */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-10 bg-primary-foreground" : "w-4 bg-primary-foreground/40"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => go(-1)} aria-label="Previous" className="w-10 h-10 rounded-full border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="w-10 h-10 rounded-full border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
