import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3 rounded-2xl bg-card/60 backdrop-blur-xl border border-border">
        <a href="/" className="text-2xl font-bold font-display text-gradient">
          Arodx
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
        </div>
        <a
          href="#pricing"
          className="px-5 py-2 text-sm font-medium rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get Quote
        </a>
      </div>
    </motion.nav>
  );
};

export default Navbar;
