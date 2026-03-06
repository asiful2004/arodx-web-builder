import { motion } from "framer-motion";
import { Users, Target, Award, Heart } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "আমাদের লক্ষ্য",
    description: "প্রতিটি ব্র্যান্ডকে ডিজিটাল দুনিয়ায় সফল করা এবং তাদের গ্রোথ নিশ্চিত করা।",
  },
  {
    icon: Award,
    title: "মানসম্মত কাজ",
    description: "আমরা প্রতিটি প্রজেক্টে সর্বোচ্চ মানের কাজ ডেলিভার করি, কোনো কম্প্রোমাইজ নেই।",
  },
  {
    icon: Heart,
    title: "ক্লায়েন্ট সন্তুষ্টি",
    description: "ক্লায়েন্টের সন্তুষ্টি আমাদের সবচেয়ে বড় অর্জন। ১০০% সাপোর্ট গ্যারান্টি।",
  },
  {
    icon: Users,
    title: "দক্ষ টিম",
    description: "অভিজ্ঞ ডিজাইনার, ডেভেলপার ও মার্কেটারদের একটি সমন্বিত টিম।",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/30 text-primary bg-primary/5">
              About Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              আমরা <span className="text-gradient">Arodx</span>
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Arodx একটি ফুল-সার্ভিস ডিজিটাল এজেন্সি। আমরা ছোট-বড় সব ধরনের ব্যবসাকে অনলাইনে প্রতিষ্ঠিত করতে সাহায্য করি। আমাদের টিম ক্রিয়েটিভ ডিজাইন, ওয়েব ডেভেলপমেন্ট এবং ডিজিটাল মার্কেটিং — সবকিছুতে পারদর্শী।
            </p>
            <p className="text-muted-foreground leading-relaxed">
              আমাদের মিশন হলো বাংলাদেশের প্রতিটি ব্যবসাকে ডিজিটাল দুনিয়ায় সফল করা। আমরা বিশ্বাস করি, সঠিক ডিজিটাল স্ট্র্যাটেজি যেকোনো ব্যবসাকে নতুন উচ্চতায় নিয়ে যেতে পারে।
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-6"
          >
            {[
              { number: "50+", label: "সম্পন্ন প্রজেক্ট" },
              { number: "30+", label: "সন্তুষ্ট ক্লায়েন্ট" },
              { number: "3+", label: "বছরের অভিজ্ঞতা" },
              { number: "24/7", label: "সাপোর্ট" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl border border-border bg-card text-center"
              >
                <div className="text-3xl font-bold font-display text-gradient mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Values */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <value.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold font-display mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
