import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"build" | "reveal" | "exit">("build");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        const jump = Math.random() * 12 + 3;
        return Math.min(p + jump, 100);
      });
    }, 80);
    const t1 = setTimeout(() => setPhase("reveal"), 2200);
    const t2 = setTimeout(() => setPhase("exit"), 3200);
    const t3 = setTimeout(onComplete, 3800);
    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const codeLines = [
    { text: "const arodx = new Agency();", delay: 0 },
    { text: "arodx.init({ mode: 'creative' });", delay: 0.3 },
    { text: "await arodx.buildDreams();", delay: 0.6 },
    { text: "// ✨ Ready to launch!", delay: 1.0 },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="preloader"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        {/* Scanning line */}
        <motion.div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"
          initial={{ top: "0%" }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`orbit-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary"
            style={{ top: "50%", left: "50%" }}
            animate={{
              x: [0, Math.cos(i * 2.1) * 120, Math.cos(i * 2.1 + 2) * 80, 0],
              y: [0, Math.sin(i * 2.1) * 120, Math.sin(i * 2.1 + 2) * 80, 0],
              opacity: [0, 0.8, 0.4, 0],
              scale: [0, 1, 0.6, 0],
            }}
            transition={{ duration: 3, delay: i * 0.4, ease: "easeInOut" }}
          />
        ))}

        <div className="relative flex flex-col items-center gap-8 px-6">
          {/* Terminal-style code block */}
          <motion.div
            className="w-full max-w-md rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-card"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-[10px] text-muted-foreground font-mono tracking-wider">arodx.terminal</span>
            </div>

            {/* Code lines */}
            <div className="p-4 font-mono text-xs md:text-sm space-y-2">
              {codeLines.map((line, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: line.delay + 0.3, duration: 0.4, ease: "easeOut" }}
                >
                  <span className="text-primary/50 select-none">{`>`}</span>
                  <motion.span
                    className={i === 3 ? "text-primary" : "text-foreground/80"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: line.delay + 0.5, duration: 0.3 }}
                  >
                    {line.text}
                  </motion.span>
                </motion.div>
              ))}

              {/* Blinking cursor */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <span className="text-primary/50 select-none">{`>`}</span>
                <motion.span
                  className="inline-block w-2 h-4 bg-primary"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Initializing</span>
              <span className="text-[10px] font-mono text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-primary"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>

          {/* Logo reveal */}
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={phase !== "build" ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-0.5">
              {["A", "r", "o", "d", "x"].map((letter, i) => (
                <motion.span
                  key={i}
                  className="text-4xl md:text-5xl font-bold font-display text-gradient inline-block"
                  initial={{ opacity: 0, y: 30, rotateX: -90 }}
                  animate={phase !== "build" ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 150, damping: 12 }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            <motion.p
              className="text-muted-foreground text-xs font-mono tracking-[0.3em] uppercase"
              initial={{ opacity: 0 }}
              animate={phase !== "build" ? { opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Digital Growth Partner
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Preloader;
