import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const HeroSection = () => {
  const { data: settings } = useSiteSettings();
  const hero = settings?.hero;

  const badge = hero?.badge || "Digital Agency";
  const titlePrefix = hero?.title_prefix || "We Are";
  const titleBrand = hero?.title_brand || "Arodx";
  const subtitle = hero?.subtitle || "স্বপ্ন আপনার, বাস্তবে রূপ দেবো আমরা।";
  const description = hero?.description || "Creative design, development এবং marketing সবকিছু এক ছাদের নিচে।";
  const ctaPrimaryText = hero?.cta_primary_text || "Get Started";
  const ctaPrimaryLink = hero?.cta_primary_link || "#pricing";
  const ctaSecondaryText = hero?.cta_secondary_text || "আমাদের কাজ দেখুন";
  const ctaSecondaryLink = hero?.cta_secondary_link || "#portfolio";

  return (
    <section aria-label="Hero - Arodx Digital Agency" className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-[hero-blob-1_12s_ease-in-out_infinite]"
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-[100px] animate-[hero-blob-2_15s_ease-in-out_infinite]"
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20 animate-[hero-particle_4s_ease-in-out_infinite]"
            style={{
              left: `${5 + (i * 37) % 90}%`,
              top: `${10 + (i * 53) % 80}%`,
              animationDuration: `${4 + (i % 3) * 2}s`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 100, damping: 15 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full border-2 text-primary bg-primary/5 animate-[rgb-border_4s_linear_infinite]">
            {badge}
          </span>
        </motion.div>

        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold font-display tracking-tight mb-6"
        >
          <span>
            {titlePrefix}{" "}
          </span>
          <span className="inline-flex relative">
            {titleBrand.split("").map((letter, i) => (
              <motion.span
                key={i}
                className="text-gradient inline-block cursor-default relative"
                initial={{ opacity: 0, y: 80, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ type: "spring" as const, stiffness: 150, damping: 12, delay: 0.1 + i * 0.06 }}
                whileHover={{ y: -12, scale: 1.2, transition: { type: "spring" as const, stiffness: 400, damping: 10 } }}
                style={{ display: "inline-block" }}
              >
                {letter}
              </motion.span>
            ))}
            <motion.div
              className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-primary rounded-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute inset-0 blur-2xl bg-primary/20 -z-10 rounded-full"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.6, 0.3], scale: [0.5, 1.2, 1] }}
              transition={{ delay: 0.4, duration: 1.5 }}
            />
          </span>
        </h1>

        <p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-3"
        >
          {subtitle}
        </p>

        <p
          className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-10"
        >
          {description}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 15, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" asChild className="bg-gradient-primary text-primary-foreground font-semibold px-8 py-6 text-base shadow-glow hover:opacity-90 transition-opacity relative overflow-hidden group">
              <a href={ctaPrimaryLink}>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span className="relative z-10 flex items-center">{ctaPrimaryText} <ArrowRight className="ml-2 h-5 w-5" /></span>
              </a>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" variant="outline" asChild className="border-border text-foreground px-8 py-6 text-base hover:bg-secondary hover:border-primary/30 transition-all">
              <a href={ctaSecondaryLink}>{ctaSecondaryText}</a>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <motion.a
        href="#services"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
      >
        <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-current"
          />
        </div>
        <span className="text-[10px] font-medium tracking-widest uppercase">Scroll Down</span>
      </motion.a>
    </section>
  );
};

export default HeroSection;
