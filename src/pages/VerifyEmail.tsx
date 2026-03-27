import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { MailCheck, Loader2, ShieldCheck, RefreshCw } from "lucide-react";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const { t } = useLanguage();

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      // Verify OTP via our custom edge function
      const { data, error } = await supabase.functions.invoke("send-custom-auth-email", {
        body: { type: "verify_otp", email, code: otp },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: t("auth.emailVerified"), description: t("auth.emailVerifiedDesc") });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: t("auth.verificationFailed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      // Resend OTP via our custom edge function
      const { data, error } = await supabase.functions.invoke("send-custom-auth-email", {
        body: { type: "resend_otp", email },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCooldown(60);
      toast({ title: t("auth.codeSent"), description: t("auth.codeSentDesc") });
    } catch (error: any) {
      toast({
        title: t("auth.resendFailed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResending(false);
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
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MailCheck className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mt-4">{t("auth.verifyYourEmail")}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("auth.verifyEmailDesc")}
            </p>
            <p className="text-primary font-medium mt-1 text-sm">{email}</p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              className="w-full rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("auth.verifying")}</>
              ) : (
                <><ShieldCheck className="w-4 h-4 mr-2" />{t("auth.verifyEmail")}</>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{t("auth.didntGetCode")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                {cooldown > 0
                  ? `${t("auth.resendIn")} ${cooldown}s`
                  : t("auth.resendCode")}
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/signup" className="text-primary hover:underline">
              {t("auth.backToSignUp")}
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

export default VerifyEmail;
