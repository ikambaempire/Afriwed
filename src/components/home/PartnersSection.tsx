import { motion } from "framer-motion";

const partners = [
  { name: "MTN Rwanda", initials: "MTN" },
  { name: "Bank of Kigali", initials: "BK" },
  { name: "RwandAir", initials: "RA" },
  { name: "Kigali Marriott", initials: "KM" },
  { name: "Radisson Blu", initials: "RB" },
  { name: "Serena Hotels", initials: "SH" },
  { name: "I&M Bank", initials: "I&M" },
  { name: "Airtel Rwanda", initials: "AT" },
];

const PartnersSection = () => (
  <section className="py-16 bg-muted/50 overflow-hidden">
    <div className="container mx-auto px-4 mb-8 text-center">
      <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-sans">
        Trusted By Our Partners
      </p>
    </div>
    <div className="relative">
      <motion.div
        className="flex gap-12 items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ width: "fit-content" }}
      >
        {[...partners, ...partners].map((p, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex items-center justify-center w-32 h-16 rounded-lg border border-border bg-card px-4"
          >
            <span className="font-display text-lg font-bold text-muted-foreground/60">
              {p.initials}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default PartnersSection;
