import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";

import { useToast } from "@/hooks/use-toast";
import { useDeviceAuth } from "@/hooks/useDeviceAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { QRCodeSVG } from "qrcode.react";
import { Mail, QrCode, Loader2, RefreshCw, Timer, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type LoginMode = "email" | "qr";

function getDeviceInfoSimple() {
  const ua = navigator.userAgent;
  let browser = "Unknown", os = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";
  return { browser, os, deviceName: `${browser} on ${os}` };
}

const RATE_LIMIT_KEY = "login_attempts";

function getRateLimitState() {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return { attempts: 0, lockedUntil: 0 };
    return JSON.parse(stored);
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function setRateLimitState(state: { attempts: number; lockedUntil: number }) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
}

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("email");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { checkDeviceCount, isDeviceRegistered, registerDevice } = useDeviceAuth();
  const { data: siteSettings } = useSiteSettings();

  // Rate limit config from admin settings
  const rateLimitConfig = useMemo(() => {
    const rl = siteSettings?.rate_limit;
    return {
      maxAttempts: rl?.max_attempts ?? 5,
      lockoutMinutes: rl?.lockout_minutes ?? 15,
      enabled: rl?.enabled ?? true,
    };
  }, [siteSettings]);

  // Rate limit state
  const [rateLimitState, setRateLimitStateLocal] = useState(getRateLimitState);
  const [lockCountdown, setLockCountdown] = useState(0);

  const isLocked = rateLimitConfig.enabled && rateLimitState.lockedUntil > Date.now();
  const attemptsLeft = rateLimitConfig.maxAttempts - rateLimitState.attempts;

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLocked) { setLockCountdown(0); return; }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((rateLimitState.lockedUntil - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining <= 0) {
        setRateLimitState({ attempts: 0, lockedUntil: 0 });
        setRateLimitStateLocal({ attempts: 0, lockedUntil: 0 });
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isLocked, rateLimitState.lockedUntil]);

  const recordFailedAttempt = () => {
    const current = getRateLimitState();
    const newAttempts = current.attempts + 1;
    let lockedUntil = current.lockedUntil;
    if (newAttempts >= rateLimitConfig.maxAttempts) {
      lockedUntil = Date.now() + rateLimitConfig.lockoutMinutes * 60 * 1000;
    }
    const newState = { attempts: newAttempts, lockedUntil };
    setRateLimitState(newState);
    setRateLimitStateLocal(newState);
  };

  const resetAttempts = () => {
    const newState = { attempts: 0, lockedUntil: 0 };
    setRateLimitState(newState);
    setRateLimitStateLocal(newState);
  };
  // QR login state
  const [qrLoginToken, setQrLoginToken] = useState<string | null>(null);
  const [qrLoginWaiting, setQrLoginWaiting] = useState(false);
  const [qrLoginExpired, setQrLoginExpired] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(300);

  const generateQrLogin = useCallback(async () => {
    try {
      setLoading(true);
      const info = getDeviceInfoSimple();
      const { data, error } = await supabase
        .from("device_login_requests")
        .insert({ user_email: "pending", device_info: info as any })
        .select("token")
        .single();
      if (error) throw error;
      setQrLoginToken(data.token);
      setQrLoginWaiting(true);
      setQrLoginExpired(false);
      setQrTimeLeft(300);
    } catch (err: any) {
      toast({ title: "QR তৈরি ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Auto-generate QR when switching to QR mode
  useEffect(() => {
    if (loginMode === "qr" && !qrLoginToken && !qrLoginWaiting) {
      generateQrLogin();
    }
  }, [loginMode, qrLoginToken, qrLoginWaiting, generateQrLogin]);

  // QR countdown timer
  useEffect(() => {
    if (!qrLoginWaiting || qrLoginExpired) return;
    const interval = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setQrLoginExpired(true);
          setQrLoginWaiting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrLoginWaiting, qrLoginExpired]);

  // Listen for QR approval via realtime
  useEffect(() => {
    if (!qrLoginToken || !qrLoginWaiting) return;

    const channel = supabase
      .channel(`qr-login-${qrLoginToken}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "device_login_requests", filter: `token=eq.${qrLoginToken}` },
        async (payload) => {
          const req = payload.new as any;
          if (req.status === "approved" && req.auth_token) {
            try {
              const { error } = await supabase.auth.verifyOtp({
                token_hash: req.auth_token,
                type: "magiclink",
              });
              if (error) throw error;
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await registerDevice(user.id);
              }
              toast({ title: "সফলভাবে লগইন হয়েছে! ✓" });
              navigate(redirectTo || "/");
            } catch {
              toast({ title: "লগইন ব্যর্থ", variant: "destructive" });
            }
            setQrLoginWaiting(false);
            setQrLoginToken(null);
          }
        }
      )
      .subscribe();

    const timer = setTimeout(() => {
      setQrLoginExpired(true);
      setQrLoginWaiting(false);
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timer);
    };
  }, [qrLoginToken, qrLoginWaiting, navigate, redirectTo, registerDevice, toast]);

  const handleRetryQrLogin = async () => {
    setQrLoginToken(null);
    setQrLoginExpired(false);
    setQrLoginWaiting(false);
    await generateQrLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast({ title: "অ্যাকাউন্ট লক করা হয়েছে", description: `${Math.ceil(lockCountdown / 60)} মিনিট পর আবার চেষ্টা করুন`, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (rateLimitConfig.enabled) recordFailedAttempt();
        throw error;
      }

      resetAttempts();
      const user = data.user;
      if (!user) throw new Error("User not found");

      const alreadyRegistered = await isDeviceRegistered(user.id);
      if (!alreadyRegistered) {
        const deviceCount = await checkDeviceCount(user.id);
        if (deviceCount >= 3) {
          await supabase.auth.signOut();
          toast({
            title: "সর্বোচ্চ ডিভাইস সীমা পূর্ণ",
            description: "আপনি সর্বোচ্চ ৩টি ডিভাইসে লগইন করতে পারেন। সেটিংস থেকে একটি ডিভাইস সরান।",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        await registerDevice(user.id);
      }

      toast({ title: "সফলভাবে লগইন হয়েছে!" });
      navigate(redirectTo || "/");
    } catch (error: any) {
      const msg = rateLimitConfig.enabled && attemptsLeft <= 1
        ? `অ্যাকাউন্ট ${rateLimitConfig.lockoutMinutes} মিনিটের জন্য লক হয়ে যাবে`
        : error.message;
      toast({ title: "লগইন ব্যর্থ", description: msg, variant: "destructive" });
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
          <div className="text-center mb-6">
            <Link to="/" className="text-3xl font-bold font-display text-gradient">
              Arodx
            </Link>
            <h1 className="text-2xl font-bold text-foreground mt-4">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your account</p>
          </div>

          {/* Rate Limit Lockout Warning */}
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-2"
            >
              <ShieldAlert className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-destructive">অ্যাকাউন্ট সাময়িকভাবে লক হয়েছে</p>
              <p className="text-xs text-muted-foreground">
                অনেকবার ভুল পাসওয়ার্ড দেওয়ায় {rateLimitConfig.lockoutMinutes} মিনিটের জন্য লক করা হয়েছে
              </p>
              <div className="text-lg font-bold text-destructive font-display">
                {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}
              </div>
              <Progress value={(lockCountdown / (rateLimitConfig.lockoutMinutes * 60)) * 100} className="h-1.5" />
            </motion.div>
          )}

          {/* Attempts warning */}
          {rateLimitConfig.enabled && !isLocked && rateLimitState.attempts > 0 && attemptsLeft <= 3 && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                আর {attemptsLeft}টি চেষ্টা বাকি আছে। এরপর অ্যাকাউন্ট {rateLimitConfig.lockoutMinutes} মিনিটের জন্য লক হয়ে যাবে।
              </p>
            </div>
          )}

          <div className="flex rounded-xl bg-muted/50 p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMode("email")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                loginMode === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" />
              ইমেইল লগইন
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("qr")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                loginMode === "qr"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR লগইন
            </button>
          </div>

          {/* QR Login Mode */}
          {loginMode === "qr" && (
            <div className="text-center space-y-4">
              {loading && !qrLoginToken ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">QR কোড তৈরি হচ্ছে...</p>
                </div>
              ) : qrLoginExpired ? (
                <div className="space-y-4 py-4">
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-sm text-destructive font-medium">QR কোডের মেয়াদ শেষ হয়ে গেছে</p>
                  </div>
                  <Button onClick={handleRetryQrLogin} disabled={loading} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> নতুন QR তৈরি করুন
                  </Button>
                </div>
              ) : qrLoginToken ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 inline-block mx-auto shadow-sm">
                    <QRCodeSVG value={qrLoginToken} size={180} level="H" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      স্ক্যানের অপেক্ষায়...
                    </div>
                    <p className="text-xs text-muted-foreground">
                      আপনার লগইন করা ডিভাইসের সেটিংস → নিরাপত্তা থেকে এই QR কোড স্ক্যান করুন
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <Timer className="w-3 h-3" />
                        <span>{Math.floor(qrTimeLeft / 60)}:{String(qrTimeLeft % 60).padStart(2, '0')}</span>
                      </div>
                      <Progress value={(qrTimeLeft / 300) * 100} className="h-1 w-32 mx-auto" />
                    </div>
                  </div>
                </div>
              ) : null}

              <GoogleSignInButton loading={loading} label="Sign in with Google" />
            </div>
          )}

          {/* Email Login Mode */}
          {loginMode === "email" && (
            <>
              <GoogleSignInButton loading={loading} label="Sign in with Google" />
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Email</label>
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
                  <label className="text-sm text-muted-foreground mb-1 block">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
                  disabled={loading || isLocked}
                >
                  {loading ? "Signing in..." : isLocked ? "লক করা হয়েছে" : "Sign In"}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign Up
            </Link>
          </p>
          <p className="text-center text-sm mt-2">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;
