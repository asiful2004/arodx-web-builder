import { motion } from "framer-motion";
import { X, Check, Users, UserRound, Wallet, Brain, TrendingDown, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const hiringIcons = [Wallet, Brain, TrendingDown, AlertTriangle];
const benefitIcons = [Users, ShieldCheck, Wallet, Zap];

const ComparisonSection = () => {
  const { data: settings } = useSiteSettings();
  const { t } = useLanguage();
  const cmp = settings?.comparison;

  const badge = t("comparison.badge", cmp?.badge);
  const titlePrefix = cmp?.title_prefix || "লোক নিয়োগ vs";
  const titleHighlight = cmp?.title_highlight || "Arodx টিম";
  const subtitle = cmp?.subtitle || "";
  const hiringTitle = cmp?.hiring_title || "আলাদা লোক নিয়োগ দিলে";
  const arodxTitle = cmp?.arodx_title || "আমাদের প্যাকেজ কিনলে";
  const hiringProblems = cmp?.hiring_problems || [];
  const arodxBenefits = cmp?.arodx_benefits || [];
  const comparisonPoints = cmp?.comparison_points || [];

  return (
    <section className="py-24 px-4" id="comparison">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">{badge}</span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mt-3">
            {titlePrefix} <span className="text-gradient">{titleHighlight}</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <UserRound className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-xl font-bold font-display text-destructive">{hiringTitle}</h3>
            </div>
            <div className="space-y-5">
              {hiringProblems.map((item: any, i: number) => {
                const Icon = hiringIcons[i % hiringIcons.length];
                return (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 18 }} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display text-primary">{arodxTitle}</h3>
            </div>
            <div className="space-y-5">
              {arodxBenefits.map((item: any, i: number) => {
                const Icon = benefitIcons[i % benefitIcons.length];
                return (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 18 }} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg"
        >
          <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-muted/60 backdrop-blur-sm">
            <div className="p-3 md:p-5 flex items-center">
              <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("comparison.tableHeader")}</span>
            </div>
            <div className="p-3 md:p-5 text-center border-l border-border/50">
              <div className="inline-flex items-center gap-1.5 md:gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <UserRound className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                </div>
                <span className="text-xs md:text-sm font-bold text-destructive">{t("comparison.hiring")}</span>
              </div>
            </div>
            <div className="p-3 md:p-5 text-center border-l border-primary/20 bg-primary/5">
              <div className="inline-flex items-center gap-1.5 md:gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                </div>
                <span className="text-xs md:text-sm font-bold text-primary">Arodx</span>
              </div>
            </div>
          </div>

          {comparisonPoints.map((point: any, i: number) => (
            <motion.div
              key={point.feature}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`grid grid-cols-[1.2fr_1fr_1fr] border-t border-border/50 ${i % 2 === 0 ? "bg-transparent" : "bg-muted/20"} hover:bg-muted/30 transition-colors`}
            >
              <div className="p-3 md:p-5 flex items-center">
                <span className="text-xs md:text-sm font-semibold text-foreground">{point.feature}</span>
              </div>
              <div className="p-3 md:p-5 flex items-center justify-center border-l border-border/50">
                <div className="flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5 text-destructive/60 shrink-0 hidden md:block" />
                  <span className="text-[11px] md:text-sm text-muted-foreground text-center">{point.hiring}</span>
                </div>
              </div>
              <div className="p-3 md:p-5 flex items-center justify-center border-l border-primary/20 bg-primary/[0.02]">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 hidden md:block" />
                  <span className="text-[11px] md:text-sm font-semibold text-primary text-center">{point.arodx}</span>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t-2 border-primary/20 bg-primary/[0.03]">
            <div className="p-3 md:p-5 flex items-center">
              <span className="text-xs md:text-sm font-bold text-foreground">সিদ্ধান্ত</span>
            </div>
            <div className="p-3 md:p-5 flex items-center justify-center border-l border-border/50">
              <span className="text-[11px] md:text-xs text-destructive/70 font-medium text-center">বেশি খরচ, কম ফলাফল</span>
            </div>
            <div className="p-3 md:p-5 flex items-center justify-center border-l border-primary/20">
              <span className="text-[11px] md:text-xs text-primary font-bold text-center">কম খরচে সেরা ফলাফল ✓</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
