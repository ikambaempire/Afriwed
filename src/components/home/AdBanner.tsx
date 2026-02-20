import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Ad {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: string;
  vendor_id: string | null;
}

const AdBanner = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase
      .from("advertisements")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => setAds(data ?? []));
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[current];

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden h-48 md:h-64">
          <AnimatePresence mode="wait">
            <motion.div
              key={ad.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {ad.media_type === "video" ? (
                <video
                  src={ad.media_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={ad.media_url}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent" />
              <div className="absolute inset-0 flex items-center p-8 md:p-12">
                <div>
                  <Badge variant="secondary" className="mb-2 text-xs">Sponsored</Badge>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-background mb-1">
                    {ad.title}
                  </h3>
                  {ad.description && (
                    <p className="text-background/80 text-sm max-w-md">{ad.description}</p>
                  )}
                  {ad.vendor_id && (
                    <Link
                      to={`/vendor/${ad.vendor_id}`}
                      className="inline-block mt-3 text-sm font-medium text-background underline underline-offset-4 hover:text-background/80"
                    >
                      View Vendor →
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          {ads.length > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-background" : "bg-background/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdBanner;
