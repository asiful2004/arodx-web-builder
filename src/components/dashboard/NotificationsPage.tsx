import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">নোটিফিকেশন</h1>
        <p className="text-sm text-muted-foreground">আপনার সকল আপডেট ও বিজ্ঞপ্তি</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
      >
        <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
        <p className="text-xs text-muted-foreground/70 mt-1">নতুন আপডেট আসলে এখানে দেখা যাবে</p>
      </motion.div>
    </div>
  );
}
