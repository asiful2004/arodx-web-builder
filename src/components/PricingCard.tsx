import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Star, Sparkles } from "lucide-react";
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  });

  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), {
    stiffness: 200,
    damping: 20,
  });
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), {
    stiffness: 200,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
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
      initial={{ opacity: 0, y: 80, rotateX: 20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        type: "spring" as const,
        stiffness: 80,
        damping: 15,
        delay: index * 0.15,
      }}
      style={{ perspective: 1200 }}
      className="relative"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative flex flex-col p-8 rounded-2xl border overflow-hidden ${
          pkg.popular
            ? "border-primary/50 bg-gradient-card shadow-glow"
            : "border-border bg-card shadow-card"
        }`}
      >
        {/* Animated glow that follows cursor */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            background: useTransform(
              [glowX, glowY],
              ([x, y]) =>
                `radial-gradient(600px circle at ${x}% ${y}%, hsl(var(--primary) / 0.12), transparent 40%)`
            ),
          }}
        />

        {/* Animated border glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            opacity: isHovered ? 1 : 0,
            background: useTransform(
              [glowX, glowY],
              ([x, y]) =>
                `radial-gradient(400px circle at ${x}% ${y}%, hsl(var(--primary) / 0.3), transparent 40%)`
            ),
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            WebkitMaskComposite: "xor",
            padding: "1px",
            transition: "opacity 0.5s",
          }}
        />

        {/* Floating particles for popular card */}
        {pkg.popular && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/40"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${10 + (i % 3) * 30}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut",
                }}
              />
            ))}
          </>
        )}

        {/* Popular badge */}
        {pkg.popular && (
          <motion.div
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="inline-flex items-center gap-1 px-4 py-1 text-xs font-semibold rounded-full bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="h-3 w-3" /> Most Popular
            </span>
          </motion.div>
        )}

        {/* Card content with 3D depth */}
        <motion.div
          style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          className="relative z-10"
        >
          <div className="mb-6">
            <motion.h3
              className="text-xl font-semibold font-display"
              animate={isHovered ? { x: 4 } : { x: 0 }}
              transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
            >
              {pkg.name}
            </motion.h3>
            <p className="text-muted-foreground text-sm mt-1">{pkg.description}</p>
          </div>

          <div className="mb-6">
            <motion.div
              key={isYearly ? "yearly" : "monthly"}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring" as const, stiffness: 200, damping: 15 }}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-lg text-muted-foreground line-through font-medium">
                  {pkg.currency}
                  {isYearly ? pkg.regularYearlyPrice : pkg.regularPrice}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {isYearly ? "১ম বছর ছাড়!" : "১ম মাস ছাড়!"}
                </span>
                <motion.span
                  className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {discountPercent}% OFF
                </motion.span>
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
            {pkg.features.map((feature, i) => (
              <motion.li
                key={feature}
                className="flex items-start gap-3 text-sm"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 + i * 0.05 }}
              >
                <motion.div
                  whileHover={{ scale: 1.3, rotate: 360 }}
                  transition={{ type: "spring" as const, stiffness: 300 }}
                >
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                </motion.div>
                <span className="text-secondary-foreground">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={onBuy}
              className={`w-full py-5 font-semibold relative overflow-hidden group ${
                pkg.popular
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              } transition-all`}
            >
              {/* Shine effect on button */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, hsl(var(--primary-foreground) / 0.15) 45%, hsl(var(--primary-foreground) / 0.25) 50%, hsl(var(--primary-foreground) / 0.15) 55%, transparent 60%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut",
                }}
              />
              <span className="relative z-10">শুরু করুন</span>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default PricingCard;
