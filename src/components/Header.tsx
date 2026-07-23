import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, ShieldCheck, MessageCircle, PenLine, Languages, Search, LayoutGrid, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import TopAdStrip from "@/components/TopAdStrip";
import afriwedLogo from "@/assets/afriwed-logo.png";
import { cn } from "@/lib/utils";

type CatRow = { id: string; slug: string; name: string; count: number };

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [cats, setCats] = useState<CatRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAdmin, isVendor, isAuthor, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setCatsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("blog_categories").select("id, slug, name");
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, blog_post_categories(category_id)")
        .eq("status", "publish")
        .eq("language", lang);
      const tally: Record<string, number> = {};
      (posts ?? []).forEach((p: any) => {
        (p.blog_post_categories ?? []).forEach((r: any) => {
          tally[r.category_id] = (tally[r.category_id] || 0) + 1;
        });
      });
      const rows: CatRow[] = (c ?? [])
        .map((x: any) => ({ ...x, count: tally[x.id] || 0 }))
        .filter((x: CatRow) => x.count > 0)
        .sort((a, b) => b.count - a.count);
      setCats(rows);
      setTotal((posts ?? []).length);
    })();
  }, [lang]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/stories?q=${encodeURIComponent(q)}`);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
      <TopAdStrip hidden={scrolled} />

      {/* Logo bar */}
      <div className="container mx-auto px-4 flex items-center justify-center py-4 border-b border-border/50">
        <Link to="/" aria-label="Afriwedd home" className="inline-flex items-center w-full max-w-md justify-center">
          <img src={afriwedLogo} alt="AfriWed" className="w-full h-auto max-h-40 object-contain" />
        </Link>
      </div>

      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        {/* Categories dropdown - top left */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setCatsOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={catsOpen}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">{t("Categories")}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", catsOpen && "rotate-180")} />
          </button>

          {catsOpen && (
            <div
              role="listbox"
              className="absolute z-50 mt-2 left-0 w-[640px] max-w-[95vw] bg-popover border border-border rounded-2xl shadow-xl p-2 animate-in fade-in-0 zoom-in-95"
            >
              <div className="max-h-[70vh] overflow-y-auto grid grid-cols-2 gap-1">
                <Link
                  to="/stories"
                  onClick={() => setCatsOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-muted"
                >
                  <span>{t("All")}</span>
                  <span className="text-xs text-muted-foreground">{total}</span>
                </Link>
                {cats.map((c) => (
                  <Link
                    key={c.id}
                    to={`/stories?category=${c.slug}`}
                    onClick={() => setCatsOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-muted"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">{c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          <Link to="/stories" className="px-3 h-9 inline-flex items-center text-sm font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap">
            {t("Stories")}
          </Link>
          <Link to="/planning" className="px-3 h-9 inline-flex items-center text-sm font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap">
            {t("Plan Wedding")}
          </Link>
          {user && (
            <Link to="/messages" className="px-3 h-9 inline-flex items-center text-sm font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap">
              <MessageCircle className="w-4 h-4 inline mr-1" />{t("Messages")}
            </Link>
          )}
          {isAuthor && (
            <Link to="/author-dashboard" className="px-3 h-9 inline-flex items-center text-sm font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap">
              <PenLine className="w-4 h-4 inline mr-1" />{t("Author")}
            </Link>
          )}
          {isVendor && (
            <Link to="/vendor-dashboard" className="px-3 h-9 inline-flex items-center text-sm font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap">
              <LayoutDashboard className="w-4 h-4 inline mr-1" />{t("Vendor Dashboard")}
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="px-3 h-9 inline-flex items-center text-sm font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap">
              <ShieldCheck className="w-4 h-4 inline mr-1" />{t("Admin")}
            </Link>
          )}
        </nav>

        {/* Search bar */}
        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md ml-auto relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search stories...")}
            className="w-full h-10 pl-11 pr-24 rounded-full bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition"
          >
            {t("Search")}
          </button>
        </form>

        {/* Language + auth */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-full border border-border overflow-hidden text-xs font-medium" role="group" aria-label="Language">
            <button onClick={() => setLang("en")} className={`px-3 py-1.5 transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`} aria-pressed={lang === "en"}>EN</button>
            <button onClick={() => setLang("rw")} className={`px-3 py-1.5 transition-colors ${lang === "rw" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`} aria-pressed={lang === "rw"}>RW</button>
          </div>
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" />{t("Sign Out")}</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">{t("Sign In")}</Link></Button>
              <Button size="sm" asChild><Link to="/auth?tab=vendor">{t("List Your Business")}</Link></Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden ml-auto p-2 text-foreground"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 animate-fade-in">
          <form onSubmit={onSearch} className="relative mt-3">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search stories...")}
              className="w-full h-11 pl-11 pr-4 rounded-full bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </form>

          <div className="flex items-center justify-between py-3 mt-2 border-b border-border">
            <span className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Languages className="w-3.5 h-3.5" />{t("Language")}</span>
            <div className="flex items-center rounded-full border border-border overflow-hidden text-xs font-medium">
              <button onClick={() => setLang("en")} className={`px-3 py-1 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
              <button onClick={() => setLang("rw")} className={`px-3 py-1 ${lang === "rw" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>RW</button>
            </div>
          </div>

          <nav className="flex flex-col gap-3 py-3">
            <Link to="/stories" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
              {t("Stories")}
            </Link>
            <Link to="/planning" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
              {t("Plan Wedding")}
            </Link>
            {user && (
              <Link to="/messages" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                {t("Messages")}
              </Link>
            )}
            {isVendor && (
              <Link to="/vendor-dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                {t("Vendor Dashboard")}
              </Link>
            )}
            {isAuthor && (
              <Link to="/author-dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                {t("Author Dashboard")}
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                {t("Admin Panel")}
              </Link>
            )}
            {user && !isAuthor && (
              <Link to="/author-apply" className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                {t("Become an Author")}
              </Link>
            )}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { signOut(); setIsOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-1" />{t("Sign Out")}
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="flex-1" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>{t("Sign In")}</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>{t("List Your Business")}</Link>
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
