import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PricingCard from "@/components/PricingCard";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultPackages = [
  { name: "Starter", regularPrice: "2,500", firstYearPrice: "1,500", regularYearlyPrice: "25,000", firstYearYearlyPrice: "15,000", currency: "৳", description: "ছোট ব্যবসার জন্য পারফেক্ট শুরু", popular: false, features: ["Website + ১টি Landing Page (Hosting সহ)", "Basic Maintenance & Support", "মাসে ২টি Video Edit", "Basic SEO Setup", "১টি Social Media Management", "Basic Brand Guidelines"] },
  { name: "Business", regularPrice: "5,500", firstYearPrice: "3,500", regularYearlyPrice: "55,000", firstYearYearlyPrice: "35,000", currency: "৳", description: "গ্রোয়িং ব্যবসার জন্য সেরা চয়েস", popular: true, features: ["Website + ৫টি Landing Page (Hosting সহ)", "Full Maintenance & Technical Support", "মাসে ৫টি Video Edit", "Advanced SEO + Ad Campaign", "৩টি Social Media Management", "Brand Strategy & Logo Optimization", "Monthly Graphics Package", "Basic Business Automation"] },
  { name: "Enterprise", regularPrice: "9,999", firstYearPrice: "8,500", regularYearlyPrice: "99,990", firstYearYearlyPrice: "85,000", currency: "৳", description: "বড় ব্র্যান্ড ও কোম্পানির জন্য", popular: false, features: ["Website + ১০টি Landing Page (Hosting সহ)", "Free .com Domain (১ বছরের জন্য)", "Priority Technical Support & Maintenance", "Unlimited Video Editing", "Complete Digital Marketing (SEO, Ads, Organic)", "All Social Media Management", "Complete Brand Identity & Strategy", "Premium Graphics & UI/UX Design", "Advanced Business Automation", "Dedicated Account Manager"] },
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const pricing = settings?.pricing;

  const badge = pricing?.badge || "Pricing";
  const title = pricing?.title || "আমাদের";
  const titleHighlight = pricing?.title_highlight || "প্যাকেজ";
  const subtitle = pricing?.subtitle || "আপনার বাজেট ও প্রয়োজন অনুযায়ী সেরা প্যাকেজ বেছে নিন";
  const packages = pricing?.packages || defaultPackages;
  const customCtaText = pricing?.custom_cta_text || "আপনার প্রয়োজন অনুযায়ী Custom Package বানাতে চান?";
  const customCtaDesc = pricing?.custom_cta_description || "আমাদের টিমের সাথে যোগাযোগ করুন এবং আপনার বাজেট ও চাহিদা অনুযায়ী প্যাকেজ তৈরি করুন।";

  const handleBuy = (pkg: any) => {
    const amount = isYearly ? pkg.firstYearYearlyPrice : pkg.firstYearPrice;
    const billing = isYearly ? "yearly" : "monthly";
    navigate(`/checkout?package=${pkg.name}&amount=${amount}&currency=${encodeURIComponent(pkg.currency)}&billing=${billing}`);
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
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">{badge}</span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mt-3">
            {title} <span className="text-gradient">{titleHighlight}</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">{subtitle}</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isYearly ? "bg-primary" : "bg-muted"}`}
              aria-label="Toggle billing period"
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary-foreground shadow-md"
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>Yearly</span>
            <motion.span
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              2 মাস ফ্রি!
            </motion.span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {packages.map((pkg: any, index: number) => (
            <PricingCard key={pkg.name} pkg={pkg} isYearly={isYearly} onBuy={() => handleBuy(pkg)} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mt-12 text-center p-8 rounded-2xl border border-primary/20 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 animate-[gradient-shift_6s_ease-in-out_infinite] bg-[length:200%_100%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 rounded-2xl border border-primary/10 group-hover:border-primary/30 transition-colors duration-500" />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-[pulse_4s_ease-in-out_infinite_1s]" />

          <div className="relative z-10">
            <p className="text-lg text-muted-foreground">
              {customCtaText.includes("Custom Package") ? (
                <>
                  {customCtaText.split("Custom Package")[0]}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">Custom Package</span>
                  {customCtaText.split("Custom Package")[1]}
                </>
              ) : customCtaText}
            </p>
            <p className="text-muted-foreground text-sm mt-2 mb-4">{customCtaDesc}</p>
            <Button
              onClick={() => {
                const contactSection = document.getElementById("contact");
                contactSection?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 px-8 py-5 font-semibold shadow-glow transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
            >
              যোগাযোগ করুন
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
