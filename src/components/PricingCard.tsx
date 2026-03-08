import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

interface PricingCardProps {
  pkg: {
    name: string;
    regularPrice: string;
    firstYearPrice: string;
    regularYearlyPrice: string;
    firstYearYearlyPrice: string;
    currency: string;
    description: string;
    popular: boolean;
    features: string[];
  };
  isYearly: boolean;
  onBuy: () => void;
  index: number;
}

const PricingCard = ({ pkg, isYearly, onBuy, index }: PricingCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(smoothY, [0, 1], [4, -4]);
  const rotateY = useTransform(smoothX, [0, 1], [-4, 4]);

  const glowBackground = useTransform(
    [smoothX, smoothY],
    ([x, y]) =>
      `radial-gradient(500px circle at ${(x as number) * 100}% ${(y as number) * 100}%, hsl(190 90% 50% / 0.08), transparent 50%)`
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setIsHovered(false);
  };

  const regular = parseInt(
    (isYearly ? pkg.regularYearlyPrice : pkg.regularPrice).replace(/,/g, "")
  );
  const discounted = parseInt(
    (isYearly ? pkg.firstYearYearlyPrice : pkg.firstYearPrice).replace(/,/g, "")
  );
  const discountPercent = Math.round(((regular - discounted) / regular) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        type: "spring" as const,
        stiffness: 100,
        damping: 18,
        delay: index * 0.12,
      }}
      style={{ perspective: 800 }}
      className={`relative pt-4 ${pkg.popular ? "md:-mt-4 md:mb-[-16px]" : ""}`}
    >
      {/* Popular badge — centered on top border of the card */}
      {pkg.popular && (
        <div className="absolute top-[4px] left-1/2 -translate-x-1/2 z-20">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, type: "spring" as const, stiffness: 200 }}
            className="inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-semibold rounded-full bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/25 whitespace-nowrap"
          >
            <Sparkles className="h-3 w-3" /> Most Popular
          </motion.span>
        </div>
      )}

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ y: -8, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }}
        className={`relative flex flex-col h-full p-8 rounded-2xl border overflow-hidden transition-colors duration-300 ${
          pkg.popular
            ? "border-primary/40 bg-gradient-card shadow-glow"
            : "border-border bg-card shadow-card hover:border-primary/20"
        }`}
      >
        {/* Cursor-following glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: glowBackground,
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />

        {/* Top edge glow for popular */}
        {pkg.popular && (
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="text-xl font-semibold font-display">{pkg.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">{pkg.description}</p>
          </div>

          <div className="mb-6">
            <motion.div
              key={isYearly ? "yearly" : "monthly"}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-lg text-muted-foreground line-through font-medium">
                  {pkg.currency}
                  {isYearly ? pkg.regularYearlyPrice : pkg.regularPrice}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {isYearly ? "১ম বছর ছাড়!" : "১ম মাস ছাড়!"}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                  {discountPercent}% OFF
                </span>
              </div>
              <span className="text-4xl font-bold font-display text-primary">
                {pkg.currency}
                {isYearly ? pkg.firstYearYearlyPrice : pkg.firstYearPrice}
              </span>
              <span className="text-muted-foreground text-sm">
                /{isYearly ? "year" : "month"}
              </span>
              <p className="text-xs text-muted-foreground mt-2">
                রিনিউয়াল: {pkg.currency}
                {isYearly ? pkg.regularYearlyPrice : pkg.regularPrice}/
                {isYearly ? "year" : "month"}
              </p>
            </motion.div>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {pkg.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-secondary-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={onBuy}
              className={`w-full py-5 font-semibold relative overflow-hidden group ${
                pkg.popular
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              } transition-all`}
            >
              {/* Shine sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="relative z-10">শুরু করুন</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PricingCard;
