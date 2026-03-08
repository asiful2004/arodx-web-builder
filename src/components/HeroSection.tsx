import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Animated background glow effects */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-[100px]"
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 20, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating grid dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{
              left: `${5 + (i * 37) % 90}%`,
              top: `${10 + (i * 53) % 80}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.5, 0.1],
            }}
            transition={{
              duration: 4 + (i % 3) * 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
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
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full border border-primary/30 text-primary bg-primary/5">
            Digital Agency
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 15, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold font-display tracking-tight mb-6"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            We Are{" "}
          </motion.span>
          <span className="inline-flex relative">
            {["A", "r", "o", "d", "x"].map((letter, i) => (
              <motion.span
                key={i}
                className="text-gradient inline-block cursor-default relative"
                initial={{ opacity: 0, y: 80, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  type: "spring" as const,
                  stiffness: 150,
                  damping: 12,
                  delay: 0.5 + i * 0.08,
                }}
                whileHover={{
                  y: -12,
                  scale: 1.2,
                  transition: { type: "spring" as const, stiffness: 400, damping: 10 },
                }}
                style={{ display: "inline-block" }}
              >
                {letter}
              </motion.span>
            ))}
            {/* Animated underline */}
            <motion.div
              className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-primary rounded-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Glow behind text */}
            <motion.div
              className="absolute inset-0 blur-2xl bg-primary/20 -z-10 rounded-full"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.6, 0.3], scale: [0.5, 1.2, 1] }}
              transition={{ delay: 0.8, duration: 1.5 }}
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 15, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-3"
        >
          ব্যবসা আপনার, tension আমাদের।
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 15, delay: 0.5 }}
          className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-10"
        >
          Creative design, development এবং marketing সবকিছু এক ছাদের নিচে।
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 15, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" asChild className="bg-gradient-primary text-primary-foreground font-semibold px-8 py-6 text-base shadow-glow hover:opacity-90 transition-opacity relative overflow-hidden group">
              <a href="#pricing">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span className="relative z-10 flex items-center">Get Started <ArrowRight className="ml-2 h-5 w-5" /></span>
              </a>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" variant="outline" asChild className="border-border text-foreground px-8 py-6 text-base hover:bg-secondary hover:border-primary/30 transition-all">
              <a href="#portfolio">আমাদের কাজ দেখুন</a>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Mouse scroll indicator */}
      <motion.a
        href="#services"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
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
