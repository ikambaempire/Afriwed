import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import FeaturedVendors from "@/components/home/FeaturedVendors";
import HowItWorks from "@/components/home/HowItWorks";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import PartnersSection from "@/components/home/PartnersSection";
import AdBanner from "@/components/home/AdBanner";

const Index = () => (
  <>
    <Header />
    <main>
      <HeroSection />
      <AdBanner />
      <CategoriesSection />
      <FeaturedVendors />
      <HowItWorks />
      <PartnersSection />
      <TestimonialsSection />
    </main>
    <Footer />
  </>
);

export default Index;
