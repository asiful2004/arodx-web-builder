import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useBranding } from "@/hooks/useBranding";

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const branding = useBranding();
  const preloaderSrc = branding.preloader_logo_url || "";
  const [phase, setPhase] = useState<"morph" | "logo" | "exit">("morph");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("logo"), 2000);
    const t2 = setTimeout(() => setPhase("exit"), 3200);
    const t3 = setTimeout(onComplete, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="preloader"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Radial gradient pulse */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
          animate={{ scale: [0.3, 1.5, 1], opacity: [0, 0.6, 0.3] }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 70%)" }}
          animate={{ scale: [0.5, 1.3, 0.9], opacity: [0, 0.4, 0.2], x: [0, 60, 30] }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
        />

        <div className="relative flex flex-col items-center">
          {/* Morphing shape — the star of the show */}
          <motion.div className="relative w-40 h-40 md:w-52 md:h-52 flex items-center justify-center">
            {/* Ring 1 — outer rotating ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
            />
            {/* Ring 2 — counter-rotating */}
            <motion.div
              className="absolute inset-3 rounded-full border border-accent/15"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            {/* Animated logo GIF or text fallback */}
            {preloaderSrc ? (
              <motion.img
                src={preloaderSrc}
                alt="Loading"
                className="relative w-24 h-24 md:w-32 md:h-32 object-contain z-10"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              />
            ) : (
              <motion.span
                className="relative text-3xl md:text-4xl font-bold font-display text-gradient z-10"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              >
                Arodx
              </motion.span>
            )}

            {/* Orbiting particles */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                animate={{
                  x: [0, Math.cos((i * Math.PI) / 2) * 70, Math.cos((i * Math.PI) / 2 + 1) * 50, 0],
                  y: [0, Math.sin((i * Math.PI) / 2) * 70, Math.sin((i * Math.PI) / 2 + 1) * 50, 0],
                  opacity: [0, 1, 0.5, 0],
                  scale: [0, 1.5, 0.8, 0],
                }}
                transition={{ duration: 2.5, delay: 0.2 + i * 0.25, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </motion.div>

          {/* Logo text reveal */}
          <motion.div
            className="flex flex-col items-center gap-3 mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={phase !== "morph" ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center">
              {["A", "r", "o", "d", "x"].map((letter, i) => (
                <motion.span
                  key={i}
                  className="text-4xl md:text-6xl font-bold font-display text-gradient inline-block"
                  initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                  animate={phase !== "morph" ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Expanding line */}
            <motion.div
              className="h-[2px] bg-gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={phase !== "morph" ? { width: "100%" } : {}}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.p
              className="text-muted-foreground text-xs md:text-sm font-medium tracking-[0.25em] uppercase"
              initial={{ opacity: 0 }}
              animate={phase !== "morph" ? { opacity: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              {(() => { try { const stored = localStorage.getItem("app-language"); return stored === "bn" ? "আপনার ডিজিটাল গ্রোথ পার্টনার" : "Your Digital Growth Partner"; } catch { return "Your Digital Growth Partner"; } })()}
            </motion.p>
          </motion.div>

          {/* Wave dots loader */}
          <div className="flex gap-1.5 mt-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/60"
                animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Preloader;
