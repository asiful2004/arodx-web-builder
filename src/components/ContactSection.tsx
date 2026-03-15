import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const getIsOpen = () => {
  const now = new Date();
  const bdTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  const day = bdTime.getDay();
  const hour = bdTime.getHours();
  if (day === 5) return false;
  if (day === 4) return hour >= 8 && hour < 17;
  return hour >= 8;
};

const ServiceStatus = () => {
  const [isOpen, setIsOpen] = useState(getIsOpen);
  useEffect(() => {
    const interval = setInterval(() => setIsOpen(getIsOpen()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isOpen ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
      <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-destructive"}`} />
      {isOpen ? "চালু আছে" : "বন্ধ আছে"}
    </span>
  );
};

const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { data: settings } = useSiteSettings();
  const contact = settings?.contact;

  const badge = contact?.badge || "Contact";
  const title = contact?.title || "যোগাযোগ";
  const titleHighlight = contact?.title_highlight || "করুন";
  const subtitle = contact?.subtitle || "আপনার প্রজেক্ট নিয়ে কথা বলতে চান? আমাদের মেসেজ করুন!";
  const email = contact?.email || "arodxofficial@gmail.com";
  const phone = contact?.phone || "+880 1XXX-XXXXXX";
  const address = contact?.address || "ঢাকা, বাংলাদেশ";
  const officeHours = contact?.office_hours || { sat_to_wed: "8:00 AM – 12:00 AM", thursday: "8:00 AM – 5:00 PM", friday: "বন্ধ" };

  const contactItems = [
    { icon: Mail, title: "ইমেইল", value: email },
    { icon: Phone, title: "ফোন", value: phone },
    { icon: MapPin, title: "ঠিকানা", value: address },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (getIsOpen()) {
      toast({ title: "মেসেজ পাঠানো হয়েছে!", description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।" });
    } else {
      toast({ title: "মেসেজ পাঠানো হয়েছে!", description: "বর্তমানে অফিস বন্ধ আছে। অফিস চালু হলে আপনাকে রেসপন্স করা হবে।" });
    }
    setFormData({ name: "", email: "", message: "" });
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
                <ServiceStatus />
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">শনি – বুধবার</span>
                  <span className="text-foreground">{officeHours.sat_to_wed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">বৃহস্পতিবার</span>
                  <span className="text-foreground">{officeHours.thursday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">শুক্রবার</span>
                  <span className="text-destructive">{officeHours.friday}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.form
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
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
