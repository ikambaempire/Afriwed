import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import PartnersSection from "@/components/home/PartnersSection";
import EditorialFeature from "@/components/home/EditorialFeature";
import RealWeddingsPreview from "@/components/home/RealWeddingsPreview";
import StoriesPreview from "@/components/home/StoriesPreview";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const MarketplaceStrip = () => (
  <section className="py-14 bg-secondary/30 border-y border-border">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
      <div>
        <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-2">Planning a wedding?</p>
        <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight max-w-xl">
          Discover trusted vendors across Africa — venues, photographers, planners & more.
        </h3>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline" className="rounded-full"><Link to="/vendors">Browse Vendors</Link></Button>
        <Button asChild className="rounded-full"><Link to="/planning">Plan with Afriwedd <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
      </div>
    </div>
  </section>
);

const Index = () => (
  <>
    <Header />
    <main>
      <HeroSection />
      <EditorialFeature />
      <StoriesPreview />
      <RealWeddingsPreview />
      <MarketplaceStrip />
      <HowItWorks />
      <PartnersSection />
    </main>
    <Footer />
  </>
);

export default Index;
