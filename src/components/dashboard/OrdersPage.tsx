import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">আমার অর্ডার</h1>
        <p className="text-sm text-muted-foreground">আপনার সকল অর্ডারের তালিকা</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center"
      >
        <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">এখনো কোনো অর্ডার নেই</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          আপনি যখন কোনো প্যাকেজ কিনবেন, সেটি এখানে দেখা যাবে
        </p>
      </motion.div>
    </div>
  );
}
