import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, LogOut, LayoutDashboard, ShieldCheck, MessageCircle, PenLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, isVendor, isAuthor, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-display text-xl font-bold text-foreground tracking-tight">
            Haruwa
          </span>
          <span className="text-xs font-sans text-muted-foreground hidden sm:inline">Rwanda</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/vendors" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Find Vendors
          </Link>
          <Link to="/real-weddings" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Real Weddings
          </Link>
          <Link to="/stories" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Stories
          </Link>
          <Link to="/planning" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Plan Wedding
          </Link>
          {user && (
            <Link to="/messages" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-4 h-4 inline mr-1" />Messages
            </Link>
          )}
          {isAuthor && (
            <Link to="/author-dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <PenLine className="w-4 h-4 inline mr-1" />Author
            </Link>
          )}
          {isVendor && (
            <Link to="/vendor-dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <LayoutDashboard className="w-4 h-4 inline mr-1" />Vendor Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ShieldCheck className="w-4 h-4 inline mr-1" />Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" />Sign Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign In</Link></Button>
              <Button size="sm" asChild><Link to="/auth?tab=vendor">List Your Business</Link></Button>
            </>
          )}
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
            <Link to="/real-weddings" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
              Real Weddings
            </Link>
            <Link to="/stories" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
              Stories
            </Link>
            <Link to="/planning" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
              Plan Wedding
            </Link>
            {user && (
              <Link to="/messages" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                Messages
              </Link>
            )}
            {isVendor && (
              <Link to="/vendor-dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                Vendor Dashboard
              </Link>
            )}
            {isAuthor && (
              <Link to="/author-dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                Author Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                Admin Panel
              </Link>
            )}
            {user && !isAuthor && (
              <Link to="/author-apply" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                Become an Author
              </Link>
            )}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { signOut(); setIsOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-1" />Sign Out
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="flex-1" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>List Your Business</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
