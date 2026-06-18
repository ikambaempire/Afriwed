import { Link } from "react-router-dom";
import { Heart, Smartphone, Instagram, Facebook, Twitter, Youtube, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground">
    {/* Newsletter band */}
    <div className="border-b border-primary-foreground/10">
      <div className="container mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-2">Join the Afriwedd Circle</p>
          <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight">
            Weekly stories, real weddings & inspiration in your inbox.
          </h3>
        </div>
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
          <div className="flex-1 relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/40" />
            <Input
              type="email"
              required
              placeholder="your@email.com"
              className="h-12 pl-11 bg-primary-foreground/5 border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:ring-primary"
            />
          </div>
          <Button type="submit" className="h-12 px-6 rounded-md bg-primary text-primary-foreground hover:opacity-90">
            Subscribe
          </Button>
        </form>
      </div>
    </div>

    {/* Main columns */}
    <div className="container mx-auto px-4 py-14">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 fill-primary text-primary" />
            <span className="font-display text-xl font-bold tracking-tight">Afriwedd</span>
          </div>
          <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-sm mb-5">
            A modern publishing home for African weddings — stories, real weddings, expert voices and the vendors who bring it all to life.
          </p>
          <div className="flex items-center gap-3">
            {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" aria-label="social" className="w-9 h-9 rounded-full border border-primary-foreground/15 flex items-center justify-center hover:bg-primary hover:border-primary transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4 tracking-wide">Read</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/60">
            <li><Link to="/stories" className="hover:text-primary transition-colors">All Stories</Link></li>
            <li><Link to="/real-weddings" className="hover:text-primary transition-colors">Real Weddings</Link></li>
            <li><Link to="/stories" className="hover:text-primary transition-colors">Culture</Link></li>
            <li><Link to="/stories" className="hover:text-primary transition-colors">Style</Link></li>
            <li><Link to="/stories" className="hover:text-primary transition-colors">Planning</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4 tracking-wide">Contribute</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/60">
            <li><Link to="/author-apply" className="hover:text-primary transition-colors">Become an Author</Link></li>
            <li><Link to="/submit" className="hover:text-primary transition-colors">Submit Your Wedding</Link></li>
            <li><Link to="/submit?type=vendor" className="hover:text-primary transition-colors">Submit a Listing</Link></li>
            <li><Link to="/auth?tab=vendor" className="hover:text-primary transition-colors">List Your Business</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4 tracking-wide">Company</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/60">
            <li><Link to="/" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/vendors" className="hover:text-primary transition-colors">Find Vendors</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Contact</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Privacy</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Terms</Link></li>
          </ul>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-primary-foreground/10">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} Afriwedd. Crafted in Africa. All rights reserved.
        </p>
        <Link
          to="/install"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Download the App
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
