import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"face" | "wink" | "text" | "exit">("face");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("wink"), 1000);
    const t2 = setTimeout(() => setPhase("text"), 1800);
    const t3 = setTimeout(() => setPhase("exit"), 3200);
    const t4 = setTimeout(onComplete, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="preloader"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        animate={phase === "exit" ? { opacity: 0, scale: 1.1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            className="absolute w-2 h-2 rounded-full bg-primary/30"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              x: [0, (i % 2 === 0 ? 1 : -1) * (60 + i * 30)],
              y: [0, -(80 + i * 20)],
              scale: [0, 1.5, 0],
            }}
            transition={{ duration: 2, delay: 0.3 + i * 0.15, ease: "easeOut" }}
          />
        ))}

        {/* Glow orb */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]"
          animate={{ scale: [0.5, 1.3, 1], opacity: [0, 0.4, 0.2] }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        <div className="relative flex flex-col items-center gap-6">
          {/* Smiley face */}
          <motion.div
            className="relative w-28 h-28 md:w-36 md:h-36"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 12 }}
          >
            {/* Face circle */}
            <motion.div
              className="w-full h-full rounded-full border-4 border-primary bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden"
              animate={{ boxShadow: ["0 0 0px hsl(var(--primary)/0)", "0 0 40px hsl(var(--primary)/0.3)", "0 0 20px hsl(var(--primary)/0.15)"] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              {/* Left eye */}
              <motion.div
                className="absolute top-[30%] left-[28%] w-3 h-3 md:w-4 md:h-4 rounded-full bg-foreground"
                initial={{ scale: 0 }}
                animate={
                  phase === "wink" || phase === "text" || phase === "exit"
                    ? { scale: 1, scaleY: [1, 0.1, 1], transition: { scaleY: { duration: 0.3 } } }
                    : { scale: 1 }
                }
                transition={{ delay: 0.3, type: "spring" }}
              />
              {/* Right eye */}
              <motion.div
                className="absolute top-[30%] right-[28%] w-3 h-3 md:w-4 md:h-4 rounded-full bg-foreground"
                initial={{ scale: 0 }}
                animate={
                  phase === "wink" || phase === "text" || phase === "exit"
                    ? { scale: 1, scaleY: [1, 0.1, 1] }
                    : { scale: 1 }
                }
                transition={{ delay: 0.35, type: "spring", scaleY: { duration: 0.3, delay: 0.05 } }}
              />
              {/* Eye sparkles */}
              <motion.div
                className="absolute top-[26%] left-[30%] w-1.5 h-1.5 rounded-full bg-background/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
              <motion.div
                className="absolute top-[26%] right-[30%] w-1.5 h-1.5 rounded-full bg-background/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              />
              {/* Smile */}
              <motion.svg
                viewBox="0 0 100 50"
                className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[55%]"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
              >
                <motion.path
                  d="M 15 10 Q 50 45 85 10"
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                />
              </motion.svg>
              {/* Blush */}
              <motion.div
                className="absolute bottom-[28%] left-[14%] w-5 h-3 md:w-6 md:h-4 rounded-full bg-pink-400/25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              />
              <motion.div
                className="absolute bottom-[28%] right-[14%] w-5 h-3 md:w-6 md:h-4 rounded-full bg-pink-400/25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              />
            </motion.div>

            {/* Bounce animation on the whole face */}
            <motion.div
              className="absolute -top-2 -right-1"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: [0, 15, -15, 0] }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <span className="text-xl md:text-2xl">✨</span>
            </motion.div>
          </motion.div>

          {/* Logo text */}
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={phase !== "face" ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center">
              {["A", "r", "o", "d", "x"].map((letter, i) => (
                <motion.span
                  key={i}
                  className="text-4xl md:text-5xl font-bold font-display text-gradient inline-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={phase !== "face" ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.05 * i, type: "spring", stiffness: 150, damping: 12 }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            <motion.div
              className="h-[2px] bg-gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={phase !== "face" ? { width: "100%" } : {}}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.p
              className="text-muted-foreground text-xs md:text-sm font-medium tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={phase !== "face" ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              Your Digital Growth Partner
            </motion.p>
          </motion.div>

          {/* Loading wave dots */}
          <div className="flex gap-2 mt-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ y: [0, -12, 0], opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Preloader;
