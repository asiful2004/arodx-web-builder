import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const packages = [
  {
    name: "Starter",
    price: "15,000",
    currency: "৳",
    period: "/project",
    description: "ছোট ব্যবসার জন্য পারফেক্ট",
    popular: false,
    features: [
      "Single Page Website",
      "Mobile Responsive",
      "Basic SEO Setup",
      "3 Revisions",
      "1 Month Support",
    ],
  },
  {
    name: "Business",
    price: "35,000",
    currency: "৳",
    period: "/project",
    description: "গ্রোয়িং ব্যবসার জন্য সেরা চয়েস",
    popular: true,
    features: [
      "Multi-page Website (5 pages)",
      "Custom UI/UX Design",
      "Advanced SEO",
      "Social Media Setup",
      "Unlimited Revisions",
      "3 Months Support",
      "Content Creation",
    ],
  },
  {
    name: "Enterprise",
    price: "75,000",
    currency: "৳",
    period: "/project",
    description: "বড় ব্র্যান্ড ও কোম্পানির জন্য",
    popular: false,
    features: [
      "Full Custom Web App",
      "Premium UI/UX Design",
      "Complete Digital Marketing",
      "Brand Strategy & Identity",
      "E-commerce Integration",
      "Priority 24/7 Support",
      "6 Months Maintenance",
      "Analytics Dashboard",
    ],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const PricingSection = () => {
  return (
    <section className="py-24 px-4" id="pricing">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mt-3">
            আমাদের <span className="text-gradient">প্যাকেজ</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            আপনার বাজেট ও প্রয়োজন অনুযায়ী সেরা প্যাকেজ বেছে নিন
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
        >
          {packages.map((pkg) => (
            <motion.div
              key={pkg.name}
              variants={item}
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                pkg.popular
                  ? "border-primary/50 bg-gradient-card shadow-glow scale-[1.02]"
                  : "border-border bg-card shadow-card hover:border-primary/20"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1 text-xs font-semibold rounded-full bg-gradient-primary text-primary-foreground">
                    <Star className="h-3 w-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold font-display">{pkg.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{pkg.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold font-display">{pkg.currency}{pkg.price}</span>
                <span className="text-muted-foreground text-sm">{pkg.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-secondary-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-5 font-semibold ${
                  pkg.popular
                    ? "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                } transition-all`}
              >
                শুরু করুন
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
