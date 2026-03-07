import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PaymentModal from "@/components/PaymentModal";

const packages = [
  {
    name: "Starter",
    monthlyPrice: "1,500",
    yearlyPrice: "15,000",
    currency: "৳",
    description: "ছোট ব্যবসার জন্য পারফেক্ট শুরু",
    popular: false,
    features: [
      "Website + ১টি Landing Page (Hosting সহ)",
      "Basic Maintenance & Support",
      "মাসে ২টি Video Edit",
      "Basic SEO Setup",
      "১টি Social Media Management",
      "Basic Brand Guidelines",
    ],
  },
  {
    name: "Business",
    monthlyPrice: "3,500",
    yearlyPrice: "35,000",
    currency: "৳",
    description: "গ্রোয়িং ব্যবসার জন্য সেরা চয়েস",
    popular: true,
    features: [
      "Website + ৫টি Landing Page (Hosting সহ)",
      "Full Maintenance & Technical Support",
      "মাসে ৫টি Video Edit",
      "Advanced SEO + Ad Campaign",
      "৩টি Social Media Management",
      "Brand Strategy & Logo Optimization",
      "Monthly Graphics Package",
      "Basic Business Automation",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: "7,500",
    yearlyPrice: "75,000",
    currency: "৳",
    description: "বড় ব্র্যান্ড ও কোম্পানির জন্য",
    popular: false,
    features: [
      "Custom Website (Hosting সহ)",
      "Free .com Domain (১ বছরের জন্য)",
      "Priority Technical Support & Maintenance",
      "Unlimited Video Editing",
      "Complete Digital Marketing (SEO, Ads, Organic)",
      "All Social Media Management",
      "Complete Brand Identity & Strategy",
      "Premium Graphics & UI/UX Design",
      "Advanced Business Automation",
      "Dedicated Account Manager",
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
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof packages[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBuy = (pkg: typeof packages[0]) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

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

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isYearly ? "bg-primary" : "bg-muted"
              }`}
              aria-label="Toggle billing period"
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary-foreground shadow-md"
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yearly
            </span>
            {isYearly && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary"
              >
                2 মাস ফ্রি!
              </motion.span>
            )}
          </div>
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
                <motion.span
                  key={isYearly ? "yearly" : "monthly"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl font-bold font-display"
                >
                  {pkg.currency}{isYearly ? pkg.yearlyPrice : pkg.monthlyPrice}
                </motion.span>
                <span className="text-muted-foreground text-sm">
                  /{isYearly ? "year" : "month"}
                </span>
                {isYearly && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2"
                  >
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      2 Months Free
                    </span>
                  </motion.div>
                )}
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
                onClick={() => handleBuy(pkg)}
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

      {selectedPackage && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          packageName={selectedPackage.name}
          amount={isYearly ? selectedPackage.yearlyPrice : selectedPackage.monthlyPrice}
          currency={selectedPackage.currency}
          billingPeriod={isYearly ? "yearly" : "monthly"}
        />
      )}
    </section>
  );
};

export default PricingSection;
