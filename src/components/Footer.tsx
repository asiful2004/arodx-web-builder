import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const footer = settings?.footer;

  const brandName = footer?.brand_name || "Arodx";
  const tagline = footer?.tagline || "Your Digital Growth Partner";
  const copyrightText = footer?.copyright_text || "Arodx. All rights reserved.";

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-12 px-4 border-t border-border"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <motion.div whileHover={{ scale: 1.02 }}>
          <span className="text-2xl font-bold font-display text-gradient">{brandName}</span>
          <p className="text-muted-foreground text-sm mt-1">{tagline}</p>
        </motion.div>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} {copyrightText}
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
