import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Heart, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const socialIconMap: Record<string, any> = { Facebook, Instagram, Twitter, Youtube };

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const { t, language, setLanguage } = useLanguage();
  const footer = settings?.footer;

  const brandName = footer?.brand_name || "Arodx";
  const tagline = footer?.tagline || "Your Digital Growth Partner";
  const copyrightText = footer?.copyright_text || "Arodx. All rights reserved.";
  const description = footer?.description || "";
  const email = footer?.email || "arodxofficial@gmail.com";
  const phone = footer?.phone || "+880 1XXX-XXXXXX";
  const address = footer?.address || "ঢাকা, বাংলাদেশ";
  const socialLinks = footer?.social_links || [];
  const quickLinks = footer?.quick_links || [];
  const serviceLinks = footer?.service_links || [];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden"
    >
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <motion.div whileHover={{ scale: 1.02 }} className="inline-block">
                <span className="text-3xl font-bold font-display text-gradient">{brandName}</span>
              </motion.div>
              <p className="text-sm text-primary/80 font-medium mt-1 mb-3">{tagline}</p>
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{description}</p>
              )}
              {socialLinks.length > 0 && (
                <div className="flex gap-2">
                  {socialLinks.map((link: any, i: number) => {
                    const Icon = socialIconMap[link.icon] || Facebook;
                    return (
                      <motion.a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -3, scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-9 h-9 rounded-xl bg-muted/50 border border-border hover:border-primary/30 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
                      >
                        <Icon className="h-4 w-4" />
                      </motion.a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Links */}
            {quickLinks.length > 0 && (
              <div>
                <h4 className="text-sm font-bold font-display text-foreground mb-4 uppercase tracking-wider">
                  {t("footer.quickLinks")}
                </h4>
                <ul className="space-y-2.5">
                  {quickLinks.map((link: any, i: number) => {
                    const isInternal = link.url?.startsWith("/");
                    const Comp = isInternal ? Link : "a";
                    const hrefProp = isInternal ? { to: link.url } : { href: link.url };
                    return (
                      <li key={i}>
                        <motion.div whileHover={{ x: 4 }}>
                          <Comp
                            {...(hrefProp as any)}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1.5 group"
                          >
                            <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                            {link.label}
                          </Comp>
                        </motion.div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Services */}
            {serviceLinks.length > 0 && (
              <div>
                <h4 className="text-sm font-bold font-display text-foreground mb-4 uppercase tracking-wider">
                  {t("footer.services")}
                </h4>
                <ul className="space-y-2.5">
                  {serviceLinks.map((link: any, i: number) => (
                    <li key={i}>
                      <motion.a
                        href={link.url}
                        whileHover={{ x: 4 }}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1.5 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                        {link.label}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-bold font-display text-foreground mb-4 uppercase tracking-wider">
                {t("footer.contact")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href={`mailto:${email}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-start gap-2.5 group">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary/50 group-hover:text-primary transition-colors" />
                    {email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${phone}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-start gap-2.5 group">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary/50 group-hover:text-primary transition-colors" />
                    {phone}
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/50" />
                  <span className="text-sm text-muted-foreground">{address}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {copyrightText}
            </p>

            {/* Language Switcher */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
              >
                <Globe className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                <span>{language === "bn" ? "English" : "বাংলা"}</span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> by{" "}
              <span className="text-primary font-semibold">{brandName}</span> Team
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
