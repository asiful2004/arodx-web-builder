import { motion } from "framer-motion";
import { Megaphone, TrendingUp, Share2, Target } from "lucide-react";

const features = [
  { title: "ক্যাম্পেইন", description: "চলমান মার্কেটিং ক্যাম্পেইন দেখুন", icon: Target, color: "bg-green-500/10 text-green-600" },
  { title: "সোশ্যাল মিডিয়া", description: "সোশ্যাল মিডিয়া অ্যাকাউন্ট ম্যানেজ করুন", icon: Share2, color: "bg-blue-500/10 text-blue-600" },
  { title: "অ্যানালিটিক্স", description: "মার্কেটিং পারফরম্যান্স ট্র্যাক করুন", icon: TrendingUp, color: "bg-purple-500/10 text-purple-600" },
];

export default function DigitalMarketerPanel() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ডিজিটাল মার্কেটার প্যানেল</h1>
            <p className="text-xs text-muted-foreground">মার্কেটিং ক্যাম্পেইন ও অ্যানালিটিক্স</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-6 hover:bg-accent/50 transition-colors"
          >
            <div className={`h-10 w-10 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Megaphone className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">শীঘ্রই আরও ফিচার আসছে...</p>
      </div>
    </div>
  );
}
