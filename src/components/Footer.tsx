import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground">
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 fill-primary text-primary" />
            <span className="font-display text-lg font-bold">Royal Knot</span>
          </div>
          <p className="text-sm text-primary-foreground/60 leading-relaxed">
            Rwanda's premier wedding planning platform. Find, book, and manage your dream wedding vendors all in one place.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4">For Couples</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li><Link to="/vendors" className="hover:text-primary transition-colors">Find Vendors</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Wedding Checklist</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Budget Planner</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4">For Vendors</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li><Link to="/" className="hover:text-primary transition-colors">List Your Business</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Pricing</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Success Stories</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li><Link to="/" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-sm text-primary-foreground/40">
        © {new Date().getFullYear()} Royal Knot Rwanda. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
