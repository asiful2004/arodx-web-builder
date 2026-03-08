import { motion } from "framer-motion";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-12 px-4 border-t border-border"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-2xl font-bold font-display text-gradient">Arodx</span>
          <p className="text-muted-foreground text-sm mt-1">Your Digital Growth Partner</p>
        </motion.div>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Arodx. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
