import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">সেটিংস</h1>
        <p className="text-sm text-muted-foreground">আপনার অ্যাকাউন্ট সেটিংস ম্যানেজ করুন</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
      >
        <Settings className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">সেটিংস শীঘ্রই আসছে</p>
      </motion.div>
    </div>
  );
}
