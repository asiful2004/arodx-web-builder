import { motion } from "framer-motion";
import {
  HelpCircle, MessageCircle, Mail, Phone, Clock,
  ChevronDown, ExternalLink, Ticket, BookOpen, Shield,
  CreditCard, Globe, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "অর্ডার ও পেমেন্ট",
    icon: CreditCard,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    items: [
      {
        q: "কিভাবে নতুন প্যাকেজ অর্ডার করবো?",
        a: "হোম পেজে গিয়ে আপনার পছন্দের প্যাকেজ সিলেক্ট করুন। তারপর পেমেন্ট ইনফরমেশন দিয়ে অর্ডার কনফার্ম করুন। অর্ডার কনফার্ম হলে আপনি ড্যাশবোর্ড থেকে সবকিছু ম্যানেজ করতে পারবেন।",
      },
      {
        q: "পেমেন্ট মেথড কি কি?",
        a: "আমরা বিকাশ, নগদ এবং রকেট এর মাধ্যমে পেমেন্ট গ্রহণ করি। পেমেন্টের সময় আপনার ট্রানজেকশন আইডি প্রদান করতে হবে।",
      },
      {
        q: "রিফান্ড কিভাবে পাবো?",
        a: "অর্ডার পেজ থেকে 'ক্যান্সেল ও রিফান্ড' বাটনে ক্লিক করুন। রিফান্ড রিকোয়েস্ট অ্যাডমিনের কাছে পাঠানো হবে এবং অ্যাপ্রুভ হলে আপনার একাউন্টে টাকা ফেরত পাঠানো হবে।",
      },
    ],
  },
  {
    title: "ওয়েবসাইট ও ডোমেইন",
    icon: Globe,
    color: "text-green-500",
    bg: "bg-green-500/10",
    items: [
      {
        q: "নিজের ডোমেইন কানেক্ট করতে পারবো?",
        a: "হ্যাঁ! আপনি নিজের ডোমেইন কানেক্ট করতে পারবেন। ব্যবসা কনফিগারেশন পেজ থেকে ডোমেইন সেটআপ করুন অথবা সাপোর্ট টিকেট খুলুন।",
      },
      {
        q: "ওয়েবসাইটে পরিবর্তন করতে কত সময় লাগে?",
        a: "সাধারণত ছোট পরিবর্তন ২৪-৪৮ ঘন্টার মধ্যে এবং বড় পরিবর্তন ৩-৭ কার্যদিবসের মধ্যে সম্পন্ন হয়। জরুরি প্রয়োজনে সাপোর্টে যোগাযোগ করুন।",
      },
    ],
  },
  {
    title: "অ্যাকাউন্ট ও নিরাপত্তা",
    icon: Shield,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    items: [
      {
        q: "পাসওয়ার্ড ভুলে গেলে কি করবো?",
        a: "লগইন পেজে 'পাসওয়ার্ড ভুলে গেছেন?' লিঙ্কে ক্লিক করুন। আপনার ইমেইলে পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হবে।",
      },
      {
        q: "একাধিক ডিভাইসে লগইন করতে পারবো?",
        a: "হ্যাঁ, সর্বোচ্চ ৩টি ডিভাইসে একসাথে লগইন থাকতে পারবেন। সেটিংস থেকে ডিভাইস ম্যানেজমেন্ট করুন এবং নতুন ডিভাইস যোগ করতে QR কোড ব্যবহার করুন।",
      },
    ],
  },
  {
    title: "সাবস্ক্রিপশন ও রিনিউয়াল",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    items: [
      {
        q: "সাবস্ক্রিপশন কিভাবে রিনিউ করবো?",
        a: "মেয়াদ শেষ হওয়ার আগে আপনাকে নোটিফিকেশন পাঠানো হবে। অর্ডার পেজ থেকে 'রিনিউ করুন' বাটনে ক্লিক করে সহজেই রিনিউ করতে পারবেন।",
      },
      {
        q: "প্যাকেজ আপগ্রেড করা যাবে?",
        a: "হ্যাঁ! আপনি যেকোনো সময় উচ্চতর প্যাকেজে আপগ্রেড করতে পারবেন। সাপোর্ট টিকেট খুলুন অথবা সরাসরি আমাদের সাথে যোগাযোগ করুন।",
      },
    ],
  },
];

const contactMethods = [
  {
    icon: MessageCircle,
    title: "লাইভ চ্যাট",
    desc: "তাৎক্ষণিক সাহায্য পান",
    detail: "হোম পেজের নিচে চ্যাট বাটন ক্লিক করুন",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Ticket,
    title: "সাপোর্ট টিকেট",
    desc: "বিস্তারিত সমস্যা জানান",
    detail: "ড্যাশবোর্ড থেকে টিকেট তৈরি করুন",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    action: true,
  },
  {
    icon: Mail,
    title: "ইমেইল",
    desc: "support@arodx.com",
    detail: "২৪ ঘন্টার মধ্যে উত্তর পাবেন",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Phone,
    title: "ফোন",
    desc: "+৮৮০ ১XXX-XXXXXX",
    detail: "সকাল ১০টা - রাত ১০টা",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">সাহায্য কেন্দ্র</h1>
            <p className="text-sm text-muted-foreground">প্রশ্নের উত্তর খুঁজুন ও সাপোর্টে যোগাযোগ করুন</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Contact */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          যোগাযোগ করুন
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contactMethods.map((method, i) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04 }}
              className={`rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all ${method.action ? "cursor-pointer" : ""}`}
              onClick={method.action ? () => navigate("/dashboard/tickets/new") : undefined}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${method.bg} flex items-center justify-center shrink-0`}>
                  <method.icon className={`w-4 h-4 ${method.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{method.title}</p>
                  <p className="text-xs text-muted-foreground">{method.desc}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{method.detail}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          সচরাচর জিজ্ঞাসা (FAQ)
        </h2>
        <div className="space-y-4">
          {faqCategories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-border/50 bg-muted/20 flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                  <cat.icon className={`w-3.5 h-3.5 ${cat.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
              </div>
              <Accordion type="single" collapsible className="px-5">
                {cat.items.map((item, j) => (
                  <AccordionItem key={j} value={`${i}-${j}`} className="border-border/50">
                    <AccordionTrigger className="text-sm text-foreground hover:text-primary py-3.5 text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Still need help */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center"
      >
        <HelpCircle className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">এখনো সাহায্য দরকার?</h3>
        <p className="text-xs text-muted-foreground mb-4">
          আমাদের সাপোর্ট টিম আপনাকে সাহায্য করতে প্রস্তুত
        </p>
        <Button onClick={() => navigate("/dashboard/tickets/new")} className="gap-2">
          <Ticket className="w-4 h-4" />
          নতুন সাপোর্ট টিকেট খুলুন
        </Button>
      </motion.div>
    </div>
  );
}
