import { Search, CalendarCheck, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Search,
    title: "Discover Vendors",
    description: "Browse through Rwanda's finest wedding professionals by category, location, and budget.",
  },
  {
    icon: CalendarCheck,
    title: "Book & Pay Securely",
    description: "Send booking requests, negotiate packages, and pay securely through our platform.",
  },
  {
    icon: PartyPopper,
    title: "Celebrate Your Day",
    description: "Enjoy your dream wedding while we handle vendor coordination and payments.",
  },
];

const HowItWorks = () => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="text-center mb-14">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">Simple Process</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          How It Works
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-teal flex items-center justify-center">
              <step.icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-sm font-bold text-gold mb-2">Step {i + 1}</div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
