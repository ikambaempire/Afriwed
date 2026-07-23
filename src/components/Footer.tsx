import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Smartphone, Instagram, Facebook, Twitter, Youtube, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

type CatCount = { id: string; slug: string; name: string; count: number };

const CategoryCounts = () => {
  const [cats, setCats] = useState<CatCount[]>([]);
  const [total, setTotal] = useState(0);
  const { lang, t } = useLanguage();

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
      const rows = (c ?? []).map(x => ({ ...x, count: tally[x.id] || 0 }))
        .filter(x => x.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
      setCats(rows);
      setTotal((posts ?? []).length);
    })();
  }, [lang]);

  if (cats.length === 0) return null;
  return (
    <div className="border-t border-primary-foreground/10">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-1">{t("Browse the archive")}</p>
            <h4 className="font-display text-2xl font-bold">{total.toLocaleString()} {t("stories")} {lang === "rw" ? t("in Kinyarwanda") : t("in English")}</h4>
          </div>
          <Link to="/stories" className="text-xs text-primary-foreground/60 hover:text-primary transition-colors">{t("View all categories →")}</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map(c => (
            <Link key={c.id} to={`/stories?category=${c.slug}`} className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary-foreground/15 text-sm text-primary-foreground/80 hover:border-primary hover:text-primary transition-colors">
              <span>{c.name}</span>
              <span className="text-xs text-primary-foreground/40 group-hover:text-primary">{c.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  const { t } = useLanguage();
  return (
  <footer className="bg-foreground text-primary-foreground">
    <CategoryCounts />

    {/* Newsletter band */}
    <div className="border-b border-primary-foreground/10">
      <div className="container mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-2">{t("Join the Afriwedd Circle")}</p>
          <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight">
            {t("Weekly stories, real weddings & inspiration in your inbox.")}
          </h3>
        </div>
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
          <div className="flex-1 relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/40" />
            <Input
              type="email"
              required
              placeholder={t("your@email.com")}
              className="h-12 pl-11 bg-primary-foreground/5 border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:ring-primary"
            />
          </div>
          <Button type="submit" className="h-12 px-6 rounded-md bg-primary text-primary-foreground hover:opacity-90">
            {t("Subscribe")}
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
            {t("A modern publishing home for African weddings — stories, real weddings, expert voices and the vendors who bring it all to life.")}
          </p>
          <div className="flex items-center gap-3">
            {[
              { Icon: Instagram, href: "https://www.instagram.com/afriwed_rw/", label: "Instagram" },
              { Icon: Facebook, href: "#", label: "Facebook (coming soon)" },
              { Icon: Twitter, href: "https://x.com/afriwed_rw", label: "X (Twitter)" },
              { Icon: Youtube, href: "https://www.youtube.com/@AfriWedRwanda", label: "YouTube" },
            ].map(({ Icon, href, label }) => {
              const disabled = href === "#";
              return (
                <a
                  key={label}
                  href={href}
                  target={disabled ? undefined : "_blank"}
                  rel={disabled ? undefined : "noopener noreferrer"}
                  aria-label={label}
                  aria-disabled={disabled || undefined}
                  onClick={(e) => { if (disabled) e.preventDefault(); }}
                  className={`w-9 h-9 rounded-full border border-primary-foreground/15 flex items-center justify-center transition-all duration-300 ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-primary hover:border-primary hover:-translate-y-0.5"}`}
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4 tracking-wide">{t("Read")}</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/60">
            <li><Link to="/stories" className="hover:text-primary transition-colors">{t("All Stories")}</Link></li>
            <li><Link to="/real-weddings" className="hover:text-primary transition-colors">{t("Real Weddings")}</Link></li>
            <li><Link to="/stories" className="hover:text-primary transition-colors">{t("Culture")}</Link></li>
            <li><Link to="/stories" className="hover:text-primary transition-colors">{t("Style")}</Link></li>
            <li><Link to="/stories" className="hover:text-primary transition-colors">{t("Planning")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4 tracking-wide">{t("Contribute")}</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/60">
            <li><Link to="/author-apply" className="hover:text-primary transition-colors">{t("Become an Author")}</Link></li>
            <li><Link to="/submit" className="hover:text-primary transition-colors">{t("Submit Your Wedding")}</Link></li>
            <li><Link to="/submit?type=vendor" className="hover:text-primary transition-colors">{t("Submit a Listing")}</Link></li>
            <li><Link to="/auth?tab=vendor" className="hover:text-primary transition-colors">{t("List Your Business")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold mb-4 tracking-wide">{t("Company")}</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/60">
            <li><Link to="/" className="hover:text-primary transition-colors">{t("About Us")}</Link></li>
            <li><Link to="/vendors" className="hover:text-primary transition-colors">{t("Find Vendors")}</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">{t("Contact")}</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">{t("Privacy")}</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">{t("Terms")}</Link></li>
          </ul>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-primary-foreground/10">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} Afriwedd. {t("Crafted in Africa. All rights reserved.")}
        </p>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-foreground/20 text-primary-foreground text-xs font-medium hover:bg-primary-foreground/10 transition-opacity">
            {t("Sign In")}
          </Link>
          <Link
            to="/install"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {t("Download the App")}
          </Link>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
