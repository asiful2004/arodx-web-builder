import { useEffect, useRef, useMemo } from "react";

// Thin outline SVG icons as path data
const ICON_PATHS = [
  // Social media (share icon)
  "M18 8A3 3 0 1 0 18 2a3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98",
  // Megaphone
  "M3 11l18-5v12L3 13v-2zm0 0v6m5-4v5a2 2 0 0 0 2 2h1",
  // Analytics graph
  "M3 3v18h18M7 16l4-4 4 4 5-8",
  // Code brackets
  "M16 18l6-6-6-6M8 6l-6 6 6 6",
  // Gear
  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  // Color palette
  "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.38-.14-.74-.39-1.02A1.5 1.5 0 0 1 14.5 18H16a8 8 0 0 0 0-16zM8 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z",
  // Globe
  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z",
  // Chat bubble
  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  // Rocket
  "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
  // Lightning bolt
  "M13 2L3 14h9l-1 10 10-12h-9l1-10z",
];

interface FloatingIcon {
  x: number;
  y: number;
  size: number;
  opacity: number;
  pathIndex: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speedX: number;
  speedY: number;
  pulse: number;
  pulseSpeed: number;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function HomepageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Generate stable icon positions
  const icons = useMemo<FloatingIcon[]>(() => {
    const count = 14;
    const result: FloatingIcon[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        x: seededRandom(i * 7 + 1) * 100,
        y: seededRandom(i * 7 + 2) * 100,
        size: 20 + seededRandom(i * 7 + 3) * 16,
        opacity: 0.04 + seededRandom(i * 7 + 4) * 0.04,
        pathIndex: i % ICON_PATHS.length,
        speedX: (seededRandom(i * 7 + 5) - 0.5) * 0.008,
        speedY: (seededRandom(i * 7 + 6) - 0.5) * 0.006,
        rotation: seededRandom(i * 7 + 7) * 360,
        rotationSpeed: (seededRandom(i * 7 + 8) - 0.5) * 0.15,
      });
    }
    return result;
  }, []);

  // Generate stable particles
  const particles = useMemo<Particle[]>(() => {
    const count = 40;
    const result: Particle[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        x: seededRandom(i * 5 + 100) * 100,
        y: seededRandom(i * 5 + 101) * 100,
        radius: 0.8 + seededRandom(i * 5 + 102) * 1.5,
        opacity: 0.15 + seededRandom(i * 5 + 103) * 0.3,
        speedX: (seededRandom(i * 5 + 104) - 0.5) * 0.015,
        speedY: (seededRandom(i * 5 + 105) - 0.5) * 0.01,
        pulse: seededRandom(i * 5 + 106) * Math.PI * 2,
        pulseSpeed: 0.005 + seededRandom(i * 5 + 107) * 0.01,
      });
    }
    return result;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.parentElement?.clientWidth || window.innerWidth;
      h = canvas.parentElement?.clientHeight || document.documentElement.scrollHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    let t = 0;
    const isMobile = window.innerWidth < 768;
    const iconCount = isMobile ? 6 : icons.length;
    const particleCount = isMobile ? 18 : particles.length;

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, w, h);

      // Gradient orbs
      const orbTime = t * 0.0008;
      
      // Primary orb (cyan-blue)
      const orb1X = w * (0.3 + Math.sin(orbTime) * 0.15);
      const orb1Y = h * (0.15 + Math.cos(orbTime * 0.7) * 0.08);
      const orb1R = Math.min(w, h) * (isMobile ? 0.35 : 0.28);
      const g1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, orb1R);
      g1.addColorStop(0, "hsla(190, 90%, 50%, 0.08)");
      g1.addColorStop(0.5, "hsla(190, 90%, 50%, 0.03)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Secondary orb (purple)
      const orb2X = w * (0.7 + Math.cos(orbTime * 0.8) * 0.12);
      const orb2Y = h * (0.35 + Math.sin(orbTime * 0.6) * 0.1);
      const orb2R = Math.min(w, h) * (isMobile ? 0.3 : 0.25);
      const g2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, orb2R);
      g2.addColorStop(0, "hsla(260, 70%, 60%, 0.06)");
      g2.addColorStop(0.5, "hsla(260, 70%, 60%, 0.02)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Third orb lower
      const orb3X = w * (0.5 + Math.sin(orbTime * 1.1) * 0.2);
      const orb3Y = h * (0.65 + Math.cos(orbTime * 0.5) * 0.1);
      const orb3R = Math.min(w, h) * (isMobile ? 0.25 : 0.2);
      const g3 = ctx.createRadialGradient(orb3X, orb3Y, 0, orb3X, orb3Y, orb3R);
      g3.addColorStop(0, "hsla(210, 80%, 55%, 0.05)");
      g3.addColorStop(1, "transparent");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // Draw particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        const px = ((p.x + p.speedX * t) % 100 + 100) % 100;
        const py = ((p.y + p.speedY * t) % 100 + 100) % 100;
        const pulseAlpha = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse + t * p.pulseSpeed));

        ctx.beginPath();
        ctx.arc(px * w / 100, py * h / 100, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(190, 80%, 70%, ${pulseAlpha})`;
        ctx.fill();

        // Subtle glow
        if (p.radius > 1.5) {
          ctx.beginPath();
          ctx.arc(px * w / 100, py * h / 100, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(190, 80%, 70%, ${pulseAlpha * 0.15})`;
          ctx.fill();
        }
      }

      // Draw floating icons using SVG path rendering via Path2D
      for (let i = 0; i < iconCount; i++) {
        const icon = icons[i];
        const ix = ((icon.x + icon.speedX * t) % 100 + 100) % 100;
        const iy = ((icon.y + icon.speedY * t) % 100 + 100) % 100;
        const rot = icon.rotation + icon.rotationSpeed * t;

        ctx.save();
        ctx.translate(ix * w / 100, iy * h / 100);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.scale(icon.size / 24, icon.size / 24);
        ctx.translate(-12, -12);

        // Parse SVG path
        const pathData = ICON_PATHS[icon.pathIndex];
        const paths = pathData.split(/(?=[M])/);
        
        ctx.strokeStyle = `hsla(190, 80%, 60%, ${icon.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Subtle neon glow
        ctx.shadowColor = "hsla(190, 90%, 50%, 0.3)";
        ctx.shadowBlur = 8;

        for (const p of paths) {
          try {
            const path2d = new Path2D(p);
            ctx.stroke(path2d);
          } catch {
            // Skip invalid paths
          }
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [icons, particles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
