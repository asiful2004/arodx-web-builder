import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast({ title: t("auth.accountCreated"), description: t("auth.checkEmailForCode") });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      toast({ title: t("auth.signUpFailed"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card/60 backdrop-blur-xl border border-border rounded-2xl p-8">
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold font-display text-gradient">
              Arodx
            </Link>
            <h1 className="text-2xl font-bold text-foreground mt-4">{t("auth.createAccount")}</h1>
            <p className="text-muted-foreground mt-2">{t("auth.signUpSubtitle")}</p>
          </div>

          <GoogleSignInButton loading={loading} label={t("auth.signUpWithGoogle")} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("auth.fullName")}</label>
              <Input
                type="text"
                placeholder={t("auth.yourName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background/50 border-border"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("auth.email")}</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("auth.password")}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-border"
                required
              />
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                {t("auth.agreeTerms").split(t("auth.termsAndConditions"))[0]}
                <Link to="/terms" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                  {t("auth.termsAndConditions")}
                </Link>{" "}
                {t("auth.and")}{" "}
                <Link to="/privacy" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                  {t("auth.privacyPolicy")}
                </Link>
              </label>
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
              disabled={loading || !agreedToTerms}
            >
              {loading ? t("auth.creatingAccount") : t("auth.signUp")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.hasAccount")}{" "}
            <Link to="/signin" className="text-primary hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
          <p className="text-center text-sm mt-2">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("auth.backToHome")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
