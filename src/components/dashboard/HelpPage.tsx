import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">সাহায্য ও সাপোর্ট</h1>
        <p className="text-sm text-muted-foreground">আমাদের সাথে যোগাযোগ করুন</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
      >
        <HelpCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">সাহায্য সেকশন শীঘ্রই আসছে</p>
      </motion.div>
    </div>
  );
}
