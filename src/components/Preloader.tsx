import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"letters" | "glow" | "exit">("letters");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("glow"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 900);
    const t3 = setTimeout(onComplete, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const letters = ["A", "r", "o", "d", "x"];

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        key="preloader"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      >
        {/* Animated background orbs */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]"
          animate={{
            scale: [0.5, 1.2, 1],
            opacity: [0, 0.5, 0.3],
          }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full bg-accent/8 blur-[100px]"
          animate={{
            scale: [0.3, 1, 0.8],
            opacity: [0, 0.4, 0.2],
            x: [0, 100, 50],
          }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        />

        <div className="relative flex flex-col items-center">
          {/* Logo letters */}
          <div className="flex items-center">
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                className="text-6xl md:text-8xl font-bold font-display text-gradient inline-block"
                initial={{ opacity: 0, y: 60, rotateY: -90, scale: 0.3 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotateY: 0,
                  scale: 1,
                }}
                transition={{
                  type: "spring" as const,
                  stiffness: 120,
                  damping: 10,
                  delay: i * 0.1,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Animated underline */}
          <motion.div
            className="h-[3px] bg-gradient-primary rounded-full mt-2"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Tagline */}
          <motion.p
            className="text-muted-foreground text-sm md:text-base mt-4 font-medium tracking-wider"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.4 }}
          >
            Your Digital Growth Partner
          </motion.p>

          {/* Loading dots */}
          <div className="flex gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Preloader;
