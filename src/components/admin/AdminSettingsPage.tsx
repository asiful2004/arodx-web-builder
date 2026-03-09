import { motion } from "framer-motion";
import { Settings, Shield } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">অ্যাডমিন সেটিংস</h1>
        <p className="text-sm text-muted-foreground">সিস্টেম কনফিগারেশন</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
      >
        <Settings className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">সেটিংস শীঘ্রই আসছে</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          এখানে সিস্টেম কনফিগারেশন অপশন যোগ করা হবে
        </p>
      </motion.div>
    </div>
  );
}
