import { motion } from "framer-motion";
import { Users, Target, Award, Heart, LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const valueIcons: LucideIcon[] = [Target, Award, Heart, Users];

const CountUpStat = ({ number, label, index }: { number: string; label: string; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring" as const, stiffness: 100, damping: 15, delay: index * 0.1 }}
      whileHover={{ y: -4, borderColor: "hsl(190 90% 50% / 0.4)" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="p-6 rounded-2xl border border-border bg-card text-center transition-colors"
    >
      <motion.div
        className="text-3xl font-bold font-display text-gradient mb-1"
        animate={isHovered ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        {number}
      </motion.div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
};

const AboutSection = () => {
  const { data: settings } = useSiteSettings();
  const { t } = useLanguage();
  const about = settings?.about;

  const badge = t("about.badge", about?.badge);
  const title = t("about.title", about?.title);
  const titleBrand = about?.title_brand || "Arodx";
  const desc1 = about?.description1 || "";
  const desc2 = about?.description2 || "";
  const stats = about?.stats || [
    { number: "50+", label: "সম্পন্ন প্রজেক্ট" },
    { number: "30+", label: "সন্তুষ্ট ক্লায়েন্ট" },
    { number: "3+", label: "বছরের অভিজ্ঞতা" },
    { number: "24/7", label: "সাপোর্ট" },
  ];
  const values = about?.values || [];

  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring" as const, stiffness: 60, damping: 15 }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/30 text-primary bg-primary/5"
            >
              {badge}
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              {title} <span className="text-gradient">{titleBrand}</span>
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">{desc1}</p>
            <p className="text-muted-foreground leading-relaxed">{desc2}</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat: any, i: number) => (
              <CountUpStat key={stat.label} number={stat.number} label={stat.label} index={i} />
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value: any, index: number) => {
            const Icon = valueIcons[index % valueIcons.length];
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring" as const, stiffness: 100, damping: 18, delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors duration-300"
              >
                <motion.div
                  className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="h-5 w-5 text-primary" />
                </motion.div>
                <h3 className="font-semibold font-display mb-2 group-hover:text-primary transition-colors duration-300">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
