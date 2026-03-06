const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border" id="contact">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-2xl font-bold font-display text-gradient">Arodx</span>
          <p className="text-muted-foreground text-sm mt-1">Your Digital Growth Partner</p>
        </div>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Arodx. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
