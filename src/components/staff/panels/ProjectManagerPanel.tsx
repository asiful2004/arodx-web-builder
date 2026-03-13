import { motion } from "framer-motion";
import { Briefcase, ClipboardList, Users, BarChart3 } from "lucide-react";

const features = [
  { title: "প্রজেক্ট ট্র্যাকিং", description: "চলমান প্রজেক্টগুলোর অবস্থা দেখুন", icon: ClipboardList, color: "bg-amber-500/10 text-amber-600" },
  { title: "টিম ম্যানেজমেন্ট", description: "টিম মেম্বারদের কাজ দেখুন ও অ্যাসাইন করুন", icon: Users, color: "bg-blue-500/10 text-blue-600" },
  { title: "রিপোর্ট", description: "প্রজেক্ট প্রগ্রেস ও পারফরম্যান্স রিপোর্ট", icon: BarChart3, color: "bg-green-500/10 text-green-600" },
];

export default function ProjectManagerPanel() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">প্রজেক্ট ম্যানেজার প্যানেল</h1>
            <p className="text-xs text-muted-foreground">প্রজেক্ট ও টিম ম্যানেজমেন্ট</p>
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
        <Briefcase className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">শীঘ্রই আরও ফিচার আসছে...</p>
      </div>
    </div>
  );
}
