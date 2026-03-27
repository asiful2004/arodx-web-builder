import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const TermsPage = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const terms = (settings?.terms_and_conditions as any) || {};
  const title = terms.title || "Terms & Conditions";
  const content = terms.content || "No terms and conditions have been added yet.";
  const lastUpdated = terms.last_updated || "";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} | Arodx</title>
        <meta name="description" content={`${title} for Arodx`} />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold font-display text-foreground mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>
        )}
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default TermsPage;
