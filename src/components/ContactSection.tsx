import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

// Check if office is currently open based on schedule data
const getIsOpenFromSchedule = (schedule?: any[]) => {
  const now = new Date();
  const bdTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  const jsDay = bdTime.getDay(); // 0=Sun
  const currentMinutes = bdTime.getHours() * 60 + bdTime.getMinutes();

  if (!schedule || schedule.length === 0) {
    // Fallback: old hardcoded logic
    if (jsDay === 5) return false;
    if (jsDay === 4) return bdTime.getHours() >= 8 && bdTime.getHours() < 17;
    return bdTime.getHours() >= 8;
  }

  const todayEntry = schedule.find((s: any) => s.dayIndex === jsDay);
  if (!todayEntry || !todayEntry.enabled) return false;

  const [openH, openM] = (todayEntry.open || "08:00").split(":").map(Number);
  const [closeH, closeM] = (todayEntry.close || "00:00").split(":").map(Number);
  const openMin = openH * 60 + openM;
  let closeMin = closeH * 60 + closeM;

  // If close is midnight (00:00) or close <= open, treat as next day (e.g. 8AM-12AM)
  if (closeMin <= openMin) closeMin += 24 * 60;

  return currentMinutes >= openMin && currentMinutes < closeMin;
};

const ServiceStatus = ({ schedule }: { schedule?: any[] }) => {
  const [isOpen, setIsOpen] = useState(() => getIsOpenFromSchedule(schedule));
  const { t } = useLanguage();
  useEffect(() => {
    setIsOpen(getIsOpenFromSchedule(schedule));
    const interval = setInterval(() => setIsOpen(getIsOpenFromSchedule(schedule)), 30000);
    return () => clearInterval(interval);
  }, [schedule]);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isOpen ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
      <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-destructive"}`} />
      {isOpen ? t("contact.open") : t("contact.closed")}
    </span>
  );
};

const ContactSection = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { data: settings } = useSiteSettings();
  const contact = settings?.contact;

  const badge = contact?.badge || t("contact.badge");
  const title = contact?.title || t("contact.title");
  const titleHighlight = contact?.title_highlight || t("contact.titleHighlight");
  const subtitle = contact?.subtitle || t("contact.subtitle");
  const email = contact?.email || "arodxofficial@gmail.com";
  const phone = contact?.phone || "+880 1XXX-XXXXXX";
  const address = contact?.address || "ঢাকা, বাংলাদেশ";
  const officeHours = contact?.office_hours || {};
  const schedule = officeHours?.schedule as any[] | undefined;

  const contactItems = [
    { icon: Mail, title: t("contact.email"), value: email },
    { icon: Phone, title: t("contact.phone"), value: phone },
    { icon: MapPin, title: t("contact.address"), value: address },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("contact_submissions" as any).insert({
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });
      if (error) throw error;
      setSubmitted(true);
      if (getIsOpenFromSchedule(schedule)) {
        toast({ title: t("contact.sent"), description: t("contact.sentDesc") });
      } else {
        toast({ title: t("contact.sent"), description: t("contact.sentDescOffline") });
      }
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 8000);
    } catch {
      toast({ title: t("contact.error"), description: t("contact.errorDesc"), variant: "destructive" });
    }
  };

  return (
    <section id="contact" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 15 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/30 text-primary bg-primary/5"
          >
            {badge}
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
            {title} <span className="text-gradient">{titleHighlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring" as const, stiffness: 60, damping: 15 }}
            className="space-y-8"
          >
            {contactItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring" as const, stiffness: 100, damping: 18 }}
                whileHover={{ x: 6 }}
                className="flex items-start gap-4 group"
              >
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <item.icon className="h-5 w-5 text-primary" />
                </motion.div>
                <div>
                  <h3 className="font-semibold font-display mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground">{item.value}</p>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring" as const, stiffness: 100, damping: 18 }}
              className="p-5 rounded-xl border border-border bg-card/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-display">অফিস কর্মসূচি</h3>
                <ServiceStatus schedule={schedule} />
              </div>
              <div className="space-y-2.5 text-sm">
                {schedule && schedule.length > 0 ? (
                  // Group consecutive days with same hours for cleaner display
                  (() => {
                    const groups: { days: string[]; open: string; close: string; enabled: boolean }[] = [];
                    schedule.forEach((entry: any) => {
                      const last = groups[groups.length - 1];
                      if (last && last.enabled === entry.enabled && last.open === entry.open && last.close === entry.close) {
                        last.days.push(entry.day);
                      } else {
                        groups.push({ days: [entry.day], open: entry.open, close: entry.close, enabled: entry.enabled });
                      }
                    });
                    const fmt12 = (t: string) => {
                      const [hStr, mStr] = t.split(":");
                      const h = parseInt(hStr, 10);
                      const period = h < 12 ? "AM" : "PM";
                      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      return `${h12}:${mStr} ${period}`;
                    };
                    return groups.map((g, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {g.days.length > 1 ? `${g.days[0]} – ${g.days[g.days.length - 1]}` : g.days[0]}
                        </span>
                        {g.enabled ? (
                          <span className="text-foreground">{fmt12(g.open)} – {fmt12(g.close)}</span>
                        ) : (
                          <span className="text-destructive">বন্ধ</span>
                        )}
                      </div>
                    ));
                  })()
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">শনি – বুধবার</span>
                      <span className="text-foreground">{officeHours.sat_to_wed || "8:00 AM – 12:00 AM"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">বৃহস্পতিবার</span>
                      <span className="text-foreground">{officeHours.thursday || "8:00 AM – 5:00 PM"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">শুক্রবার</span>
                      <span className="text-destructive">{officeHours.friday || "বন্ধ"}</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col items-center justify-center text-center p-10 rounded-2xl border border-primary/20 bg-primary/5 min-h-[320px]"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
                </motion.div>
                <h3 className="text-lg font-bold text-foreground mb-2">মেসেজ পাঠানো হয়েছে!</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  আপনার মেসেজটি আমরা পেয়েছি। অনুগ্রহ করে অপেক্ষা করুন, আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring" as const, stiffness: 60, damping: 15 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {[
                  { name: "name", type: "text", placeholder: "আপনার নাম" },
                  { name: "email", type: "email", placeholder: "আপনার ইমেইল" },
                ].map((field, i) => (
                  <motion.div key={field.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      required
                      value={formData[field.name as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 ${focusedField === field.name ? "border-primary/50 ring-2 ring-primary/20 shadow-lg shadow-primary/5" : "border-border"}`}
                    />
                  </motion.div>
                ))}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                  <textarea
                    placeholder="আপনার মেসেজ"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    onFocus={() => setFocusedField("message")}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none resize-none transition-all duration-300 ${focusedField === "message" ? "border-primary/50 ring-2 ring-primary/20 shadow-lg shadow-primary/5" : "border-border"}`}
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" size="lg" className="w-full bg-gradient-primary text-primary-foreground font-semibold py-6 hover:opacity-90 transition-opacity relative overflow-hidden group">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <span className="relative z-10 flex items-center justify-center">মেসেজ পাঠান <Send className="ml-2 h-4 w-4" /></span>
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
