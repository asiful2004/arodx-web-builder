import { motion } from "framer-motion";
import { PenTool, Code, Megaphone, ClipboardCheck, ArrowDown, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "প্রজেক্ট ম্যানেজার",
    subtitle: "পরিকল্পনা ও সমন্বয়",
    description:
      "আপনার প্রজেক্টের জন্য একজন ডেডিকেটেড প্রজেক্ট ম্যানেজার থাকেন যিনি পুরো কাজের পরিকল্পনা করেন, টাইমলাইন সেট করেন এবং টিমের সাথে সমন্বয় রাখেন। আপনাকে কোনো কিছু নিয়ে চিন্তা করতে হয় না।",
  },
  {
    number: "02",
    icon: PenTool,
    title: "গ্রাফিক্স ডিজাইনার",
    subtitle: "ক্রিয়েটিভ ডিজাইন",
    description:
      "ডেডিকেটেড ডিজাইনার আপনার ব্র্যান্ডের লোগো, ব্যানার, সোশ্যাল মিডিয়া পোস্ট এবং UI/UX ডিজাইন করেন — সম্পূর্ণ ফোকাস শুধু আপনার ব্র্যান্ডে।",
  },
  {
    number: "03",
    icon: Code,
    title: "ওয়েব ডেভেলপার",
    subtitle: "ডেভেলপমেন্ট ও টেক",
    description:
      "এক্সপার্ট ডেভেলপার আপনার ওয়েবসাইট তৈরি করেন, হোস্টিং সেটআপ করেন এবং টেকনিক্যাল সব কিছু সামলান। আপনার কোনো টেকনিক্যাল জ্ঞান লাগবে না।",
  },
  {
    number: "04",
    icon: Megaphone,
    title: "ডিজিটাল মার্কেটার",
    subtitle: "মার্কেটিং ও গ্রোথ",
    description:
      "ডেডিকেটেড মার্কেটার SEO, সোশ্যাল মিডিয়া ম্যানেজমেন্ট এবং অ্যাড ক্যাম্পেইন চালান — আপনার ব্যবসার গ্রোথ নিশ্চিত করতে।",
  },
];

const ProcessSection = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden" id="process">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            How We Work
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mt-3">
            আমাদের কাজের <span className="text-gradient">ধাপসমূহ</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            প্রতিটি প্রজেক্টে ৪ জন ডেডিকেটেড বিশেষজ্ঞ কাজ করেন — তাই সবকিছু হয় নিখুঁত, সময়মতো এবং ঝামেলামুক্ত।
          </p>
        </motion.div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    type: "spring",
                    stiffness: 80,
                    damping: 18,
                    delay: i * 0.1,
                  }}
                  className={`lg:grid lg:grid-cols-2 lg:gap-16 lg:py-12 items-center ${
                    isEven ? "" : "lg:direction-rtl"
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`${isEven ? "lg:text-right lg:pr-16" : "lg:text-left lg:pl-16 lg:col-start-2"}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors duration-300 shadow-card"
                    >
                      <div className={`flex items-center gap-4 mb-4 ${isEven ? "lg:flex-row-reverse" : ""}`}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                          <step.icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className={isEven ? "lg:text-right" : ""}>
                          <span className="text-xs font-bold text-primary tracking-widest">
                            STEP {step.number}
                          </span>
                          <h3 className="text-xl font-bold font-display">{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-primary mb-2">{step.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    </motion.div>
                  </div>

                  {/* Timeline dot - desktop only */}
                  <div
                    className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center`}
                    style={{ top: `${(i / steps.length) * 100 + 100 / (steps.length * 2)}%` }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
                      className="w-4 h-4 rounded-full bg-primary shadow-glow"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-primary/20 bg-primary/[0.03]">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-foreground">
              সবকিছু <span className="text-primary font-bold">এক টিমে</span> — আপনি শুধু ব্যবসায় ফোকাস করুন, বাকিটা আমাদের দায়িত্ব।
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSection;
