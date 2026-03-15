import { motion } from "framer-motion";
import { X, Check, Users, UserRound, ArrowRight, AlertTriangle, TrendingDown, Wallet, Brain, Clock, ShieldCheck, Zap } from "lucide-react";

const hiringProblems = [
  {
    icon: Wallet,
    title: "উচ্চ বেতন ও খরচ",
    description: "প্রতিটি পদের জন্য আলাদা বেতন, বোনাস, ট্রেনিং — মাসে ১০,০০০–১৫,০০০৳+ খরচ হতে পারে।",
  },
  {
    icon: Brain,
    title: "একজনের ওপর সব চাপ",
    description: "একজন কর্মী একা ডিজাইন, ডেভেলপমেন্ট, মার্কেটিং সব সামলাতে গিয়ে মানসিক চাপে পড়ে — ফলাফল হয় দুর্বল।",
  },
  {
    icon: TrendingDown,
    title: "ভুল ও দেরি বেশি",
    description: "অতিরিক্ত কাজের চাপে ভুল বাড়ে, ডেডলাইন মিস হয়, ব্যবসার ক্ষতি হয়।",
  },
  {
    icon: AlertTriangle,
    title: "স্কিল গ্যাপ থাকে",
    description: "একজন মানুষ সব বিষয়ে এক্সপার্ট হতে পারে না — কোনো না কোনো দিক দুর্বল থেকেই যায়।",
  },
];

const arodxBenefits = [
  {
    icon: Users,
    title: "ডেডিকেটেড টিম",
    description: "আলাদা ডেভেলপার, ডিজাইনার, মার্কেটার ও প্রজেক্ট ম্যানেজার — প্রত্যেকে নিজ নিজ ক্ষেত্রে এক্সপার্ট।",
  },
  {
    icon: ShieldCheck,
    title: "নির্ভুল ও মানসম্মত কাজ",
    description: "আলাদা ডেডিকেটেড লোক থাকায় কাজের চাপ কম, তাই প্রতিটি কাজ হয় নিখুঁত ও সময়মতো।",
  },
  {
    icon: Wallet,
    title: "খরচ অনেক কম",
    description: "একজন কর্মীর বেতনের চেয়ে কম খরচে পুরো একটি দক্ষ টিম পাচ্ছেন।",
  },
  {
    icon: Zap,
    title: "দ্রুত ও ঝামেলামুক্ত",
    description: "হোস্টিং, মেইনটেন্যান্স, সাপোর্ট — সব দায়িত্ব আমাদের। আপনি শুধু ব্যবসায় ফোকাস করুন।",
  },
];

const comparisonPoints = [
  { feature: "মাসিক খরচ", hiring: "১০,০০০–১৫,০০০৳+", arodx: "১,৫০০–৯,৯৯৯৳" },
  { feature: "টিম সাইজ", hiring: "১ জন (সব কাজ একা)", arodx: "৪-৫ জন বিশেষজ্ঞ" },
  { feature: "কাজের মান", hiring: "অনিশ্চিত", arodx: "সর্বোচ্চ মান নিশ্চিত" },
  { feature: "সাপোর্ট", hiring: "অফিস আওয়ার্সে", arodx: "24/7 সাপোর্ট" },
  { feature: "স্কেলেবিলিটি", hiring: "সীমিত", arodx: "আনলিমিটেড" },
];

const ComparisonSection = () => {
  return (
    <section className="py-24 px-4" id="comparison">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            কেন আমরা?
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mt-3">
            লোক নিয়োগ vs <span className="text-gradient">Arodx টিম</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            একজন কর্মী নিয়োগ দিয়ে সব কাজ করানো বনাম আমাদের ডেডিকেটেড টিমের সাথে কাজ করা — পার্থক্যটা দেখুন নিজেই।
          </p>
        </motion.div>

        {/* Side by side cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Hiring Problems */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <UserRound className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-xl font-bold font-display text-destructive">আলাদা লোক নিয়োগ দিলে</h3>
            </div>
            <div className="space-y-5">
              {hiringProblems.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 18 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Arodx Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display text-primary">Arodx টিমের সাথে কাজ করলে</h3>
            </div>
            <div className="space-y-5">
              {arodxBenefits.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 18 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="grid grid-cols-3 bg-muted/50 p-4 font-semibold text-sm">
            <span className="text-muted-foreground">তুলনা</span>
            <span className="text-center text-destructive">লোক নিয়োগ</span>
            <span className="text-center text-primary">Arodx</span>
          </div>
          {comparisonPoints.map((point, i) => (
            <motion.div
              key={point.feature}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-3 p-4 border-t border-border items-center text-sm"
            >
              <span className="font-medium text-foreground">{point.feature}</span>
              <span className="text-center text-muted-foreground">{point.hiring}</span>
              <span className="text-center font-semibold text-primary">{point.arodx}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
