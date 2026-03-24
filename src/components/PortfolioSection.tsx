import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultProjects = [
  { title: "E-Commerce Platform", category: "Web Development", description: "একটি সম্পূর্ণ ই-কমার্স প্ল্যাটফর্ম যেখানে পেমেন্ট ইন্টিগ্রেশন ও ইনভেন্টরি ম্যানেজমেন্ট আছে।", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop" },
  { title: "Restaurant Branding", category: "UI/UX Design", description: "একটি রেস্টুরেন্টের জন্য সম্পূর্ণ ব্র্যান্ডিং: লোগো, মেনু ডিজাইন ও ওয়েবসাইট।", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop" },
  { title: "Social Media Campaign", category: "Digital Marketing", description: "সোশ্যাল মিডিয়া ক্যাম্পেইন যা ক্লায়েন্টের সেলস ৩x বাড়িয়েছে।", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop" },
];

const PortfolioSection = () => {
  const { data: settings } = useSiteSettings();
  const port = settings?.portfolio;

  const badge = port?.badge || "Portfolio";
  const title = port?.title || "আমাদের";
  const titleHighlight = port?.title_highlight || "কাজ";
  const subtitle = port?.subtitle || "আমরা এ পর্যন্ত যেসব প্রজেক্ট সফলভাবে সম্পন্ন করেছি তার কিছু নমুনা।";
  const projects = port?.projects || defaultProjects;

  return (
    <section id="portfolio" aria-label="Portfolio - আমাদের কাজ" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full border border-primary/30 text-primary bg-primary/5">
            {badge}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
            {title} <span className="text-gradient">{titleHighlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project: any, index: number) => (
            <motion.div
              key={project.title + index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-colors"
            >
              <div className="relative overflow-hidden h-48">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary border border-primary/30">
                  {project.category}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold font-display mb-2 flex items-center gap-2">
                  {project.title}
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
