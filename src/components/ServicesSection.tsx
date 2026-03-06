import { motion } from "framer-motion";
import { Globe, Palette, TrendingUp, Code, Camera, Megaphone } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Web Development",
    description: "আধুনিক ও রেসপন্সিভ ওয়েবসাইট তৈরি করি যা আপনার ব্যবসাকে অনলাইনে নিয়ে যায়।",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "ইউজার ফ্রেন্ডলি ডিজাইন তৈরি করি যা আপনার কাস্টমারদের মুগ্ধ করবে।",
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing",
    description: "SEO, Social Media ও Ads ক্যাম্পেইনের মাধ্যমে আপনার ব্যবসা বাড়াই।",
  },
  {
    icon: Code,
    title: "App Development",
    description: "কাস্টম মোবাইল ও ওয়েব অ্যাপ্লিকেশন ডেভেলপমেন্ট।",
  },
  {
    icon: Camera,
    title: "Content Creation",
    description: "প্রফেশনাল ভিডিও, ফটোগ্রাফি ও গ্রাফিক কন্টেন্ট তৈরি।",
  },
  {
    icon: Megaphone,
    title: "Brand Strategy",
    description: "আপনার ব্র্যান্ডের জন্য সঠিক স্ট্র্যাটেজি তৈরি করি।",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ServicesSection = () => {
  return (
    <section className="py-24 px-4" id="services">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">Our Services</span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mt-3">
            আমরা যা <span className="text-gradient">করি</span>
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={item}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 shadow-card hover:shadow-glow"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-5">
                <service.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold font-display mb-2">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
