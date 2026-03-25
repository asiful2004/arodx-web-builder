import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Globe, TrendingUp, Video, Megaphone, Settings, PenTool, LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const iconMap: Record<string, LucideIcon> = {
  Globe, TrendingUp, Video, Megaphone, Settings, PenTool,
};

const defaultServices = [
  { icon: "Globe", title: "Web Development", description: "আধুনিক ও রেসপন্সিভ ওয়েবসাইট তৈরি করি যা আপনার ব্যবসাকে অনলাইনে নিয়ে যায়।" },
  { icon: "TrendingUp", title: "Digital Marketing", description: "SEO, Social Media ও Ads ক্যাম্পেইনের মাধ্যমে আপনার ব্যবসা বাড়াই।" },
  { icon: "Video", title: "Video Editing", description: "প্রফেশনাল ভিডিও এডিটিং সার্ভিস যা আপনার কন্টেন্টকে আকর্ষণীয় করে তোলে।" },
  { icon: "Settings", title: "Business Automation", description: "আপনার ব্যবসার প্রসেস অটোমেট করে সময় ও খরচ বাঁচান।" },
  { icon: "Megaphone", title: "Brand Strategy", description: "আপনার ব্র্যান্ডের জন্য সঠিক স্ট্র্যাটেজি তৈরি করি।" },
  { icon: "PenTool", title: "Graphics & UI/UX Design", description: "লোগো, ব্যানার, সোশ্যাল মিডিয়া পোস্ট ও অ্যাপ/ওয়েব UI ডিজাইন করি যা আপনার ব্র্যান্ডকে আলাদা করে তোলে।" },
];

const ServiceCard = ({ service, index }: { service: { icon: string; title: string; description: string }; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothX = useSpring(mouseX, { stiffness: 200, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 200, damping: 25 });
  const glowBackground = useTransform(
    [smoothX, smoothY],
    ([x, y]) => `radial-gradient(400px circle at ${(x as number) * 100}% ${(y as number) * 100}%, hsl(190 90% 50% / 0.06), transparent 50%)`
  );
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const IconComponent = iconMap[service.icon] || Globe;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring" as const, stiffness: 100, damping: 18, delay: index * 0.08 }}
      whileHover={{ y: -6, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); setIsHovered(false); }}
      className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors duration-300 shadow-card overflow-hidden"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: glowBackground, opacity: isHovered ? 1 : 0, transition: "opacity 0.4s ease" }}
      />
      <div className="relative z-10">
        <motion.div
          className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-5"
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <IconComponent className="h-6 w-6 text-primary-foreground" />
        </motion.div>
        <h3 className="text-xl font-semibold font-display mb-2 group-hover:text-primary transition-colors duration-300">{service.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
      </div>
    </motion.div>
  );
};

const ServicesSection = () => {
  const { data: settings } = useSiteSettings();
  const { t } = useLanguage();
  const svc = settings?.services;

  const badge = t("services.badge", svc?.badge);
  const title = t("services.title", svc?.title);
  const titleHighlight = t("services.titleHighlight", svc?.title_highlight);
  const rawItems = svc?.items || defaultServices;
  const items = rawItems.map((s: any, i: number) => ({
    ...s,
    title: t(`services.item.${i}.title`, s.title),
    description: t(`services.item.${i}.description`, s.description),
  }));

  return (
    <section className="py-24 px-4" id="services">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 15 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">{badge}</span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mt-3">
            {title} <span className="text-gradient">{titleHighlight}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((service: any, index: number) => (
            <ServiceCard key={service.title + index} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
