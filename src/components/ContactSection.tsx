import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const ServiceStatus = () => {
  const now = new Date();
  const bdTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  const day = bdTime.getDay();
  const hour = bdTime.getHours();

  let isOpen = false;
  if (day === 5) {
    isOpen = false;
  } else if (day === 4) {
    isOpen = hour >= 8 && hour < 17;
  } else {
    isOpen = hour >= 8;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
      isOpen ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
    }`}>
      <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-destructive"}`} />
      {isOpen ? "চালু আছে" : "বন্ধ আছে"}
    </span>
  );
};

const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const isOfficeOpen = () => {
    const now = new Date();
    const bdTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const day = bdTime.getDay();
    const hour = bdTime.getHours();
    if (day === 5) return false;
    if (day === 4) return hour >= 8 && hour < 17;
    return hour >= 8;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOfficeOpen()) {
      toast({
        title: "মেসেজ পাঠানো হয়েছে!",
        description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।",
      });
    } else {
      toast({
        title: "মেসেজ পাঠানো হয়েছে!",
        description: "বর্তমানে অফিস বন্ধ আছে। অফিস চালু হলে আপনাকে রেসপন্স করা হবে।",
      });
    }
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/30 text-primary bg-primary/5">
            Contact
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
            যোগাযোগ <span className="text-gradient">করুন</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            আপনার প্রজেক্ট নিয়ে কথা বলতে চান? আমাদের মেসেজ করুন!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold font-display mb-1">ইমেইল</h3>
                <p className="text-muted-foreground">arodxofficial@gmail.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold font-display mb-1">ফোন</h3>
                <p className="text-muted-foreground">+880 1XXX-XXXXXX</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold font-display mb-1">ঠিকানা</h3>
                <p className="text-muted-foreground">ঢাকা, বাংলাদেশ</p>
              </div>
            </div>

            {/* Office Schedule */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-display">অফিস কর্মসূচি</h3>
                <ServiceStatus />
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">শনি – বুধবার</span>
                  <span className="text-foreground">8:00 AM – 12:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">বৃহস্পতিবার</span>
                  <span className="text-foreground">8:00 AM – 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">শুক্রবার</span>
                  <span className="text-destructive">বন্ধ</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <input
                type="text"
                placeholder="আপনার নাম"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="আপনার ইমেইল"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <textarea
                placeholder="আপনার মেসেজ"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-primary text-primary-foreground font-semibold py-6 hover:opacity-90 transition-opacity"
            >
              মেসেজ পাঠান <Send className="ml-2 h-4 w-4" />
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
