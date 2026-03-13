import { motion } from "framer-motion";
import { Palette, Image, Layers, PenTool } from "lucide-react";

const features = [
  { title: "ডিজাইন টাস্ক", description: "অ্যাসাইন করা ডিজাইন টাস্কগুলো দেখুন", icon: PenTool, color: "bg-pink-500/10 text-pink-600" },
  { title: "প্রজেক্ট ফাইল", description: "ডিজাইন ফাইল ও অ্যাসেট ম্যানেজ করুন", icon: Image, color: "bg-purple-500/10 text-purple-600" },
  { title: "ব্র্যান্ড গাইড", description: "ক্লায়েন্টদের ব্র্যান্ড গাইডলাইন", icon: Layers, color: "bg-amber-500/10 text-amber-600" },
];

export default function GraphicsDesignerPanel() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Palette className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">গ্রাফিক্স ডিজাইনার প্যানেল</h1>
            <p className="text-xs text-muted-foreground">ডিজাইন টাস্ক ও প্রজেক্ট ম্যানেজমেন্ট</p>
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
        <Palette className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">শীঘ্রই আরও ফিচার আসছে...</p>
      </div>
    </div>
  );
}
