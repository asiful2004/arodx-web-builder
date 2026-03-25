import { motion } from "framer-motion";
import { ExternalLink, ArrowUpRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const defaultProjects = [
  { title: "E-Commerce Platform", category: "Web Development", description: "একটি সম্পূর্ণ ই-কমার্স প্ল্যাটফর্ম যেখানে পেমেন্ট ইন্টিগ্রেশন ও ইনভেন্টরি ম্যানেজমেন্ট আছে।", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop", link: "" },
  { title: "Restaurant Branding", category: "UI/UX Design", description: "একটি রেস্টুরেন্টের জন্য সম্পূর্ণ ব্র্যান্ডিং: লোগো, মেনু ডিজাইন ও ওয়েবসাইট।", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop", link: "" },
  { title: "Social Media Campaign", category: "Digital Marketing", description: "সোশ্যাল মিডিয়া ক্যাম্পেইন যা ক্লায়েন্টের সেলস ৩x বাড়িয়েছে।", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop", link: "" },
];

const categoryColors: Record<string, string> = {
  "Web Development": "bg-blue-600 text-white border-blue-500",
  "UI/UX Design": "bg-purple-600 text-white border-purple-500",
  "Digital Marketing": "bg-emerald-600 text-white border-emerald-500",
  "Graphics Design": "bg-orange-600 text-white border-orange-500",
  "Video Editing": "bg-rose-600 text-white border-rose-500",
};

const getCategoryClass = (category: string) => {
  return categoryColors[category] || "bg-primary text-primary-foreground border-primary";
};

const PortfolioSection = () => {
  const { data: settings } = useSiteSettings();
  const { t } = useLanguage();
  const port = settings?.portfolio;

  const badge = t("portfolio.badge", port?.badge);
  const title = t("portfolio.title", port?.title);
  const titleHighlight = t("portfolio.titleHighlight", port?.title_highlight);
  const subtitle = t("portfolio.subtitle", port?.subtitle);
  const rawProjects = port?.projects || defaultProjects;
  const projects = rawProjects.map((p: any, i: number) => ({
    ...p,
    title: t(`portfolio.project.${i}.title`, p.title),
    category: t(`portfolio.project.${i}.category`, p.category),
    description: t(`portfolio.project.${i}.description`, p.description),
  }));

  return (
    <section id="portfolio" aria-label="Portfolio" className="py-24 px-4">
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
          {projects.map((project: any, index: number) => {
            const Wrapper = project.link ? "a" : "div";
            const wrapperProps = project.link
              ? { href: project.link, target: "_blank", rel: "noopener noreferrer" }
              : {};

            return (
              <motion.div
                key={project.title + index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Wrapper
                  {...(wrapperProps as any)}
                  className="group block rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-glow transition-all duration-300"
                >
                  <div className="relative overflow-hidden h-52">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    <span
                      className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${getCategoryClass(project.category)}`}
                    >
                      {project.category}
                    </span>
                    {project.link && (
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold font-display mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
                      {project.title}
                      {project.link && (
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                  </div>
                </Wrapper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
