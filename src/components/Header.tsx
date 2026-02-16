import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart } from "lucide-react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-display text-xl font-bold text-foreground tracking-tight">
            Royal Knot
          </span>
          <span className="text-xs font-sans text-muted-foreground hidden sm:inline">Rwanda</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/vendors" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Find Vendors
          </Link>
          <Link to="/vendors" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Categories
          </Link>
          <Link to="/vendors" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            How It Works
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">Sign In</Button>
          <Button size="sm">List Your Business</Button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-foreground"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 animate-fade-in">
          <nav className="flex flex-col gap-3 py-3">
            <Link to="/vendors" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
              Find Vendors
            </Link>
            <Link to="/vendors" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
              Categories
            </Link>
            <Link to="/vendors" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
              How It Works
            </Link>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1">Sign In</Button>
              <Button size="sm" className="flex-1">List Your Business</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
