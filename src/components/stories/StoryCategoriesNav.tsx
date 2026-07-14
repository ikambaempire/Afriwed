import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Cat = { id: string; slug: string; name: string };

interface Props {
  cats: Cat[];
  activeCat: string;
  allLabel: string;
  moreLabel: string;
}

const StoryCategoriesNav = ({ cats, activeCat, allLabel, moreLabel }: Props) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeName =
    activeCat === "all" ? allLabel : cats.find((c) => c.slug === activeCat)?.name || allLabel;

  const chipBase =
    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50";
  const chipActive = "bg-primary text-primary-foreground shadow-md scale-[1.02]";
  const chipIdle = "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary";

  return (
    <div className="py-4">
      {/* Mobile: dropdown */}
      <div className="md:hidden relative" ref={menuRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-md"
        >
          <span className="truncate">{activeName}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div
            role="listbox"
            className="absolute z-40 mt-2 left-0 right-0 bg-popover border border-border rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto p-2 animate-in fade-in-0 zoom-in-95"
          >
            <Link
              to="/stories"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors",
                activeCat === "all"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "hover:bg-muted"
              )}
            >
              {allLabel}
              {activeCat === "all" && <Check className="w-4 h-4" />}
            </Link>
            {cats.map((c) => (
              <Link
                key={c.id}
                to={`/stories?category=${c.slug}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors",
                  activeCat === c.slug
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted"
                )}
              >
                {c.name}
                {activeCat === c.slug && <Check className="w-4 h-4" />}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tablet/Desktop: wrapping chips */}
      <div className="hidden md:flex flex-wrap gap-2 justify-center">
        <Link to="/stories" className={cn(chipBase, activeCat === "all" ? chipActive : chipIdle)}>
          {allLabel}
        </Link>
        {cats.map((c) => (
          <Link
            key={c.id}
            to={`/stories?category=${c.slug}`}
            className={cn(chipBase, activeCat === c.slug ? chipActive : chipIdle)}
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StoryCategoriesNav;
