import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { useDeviceAuth } from "@/hooks/useDeviceAuth";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Smartphone, RefreshCw, QrCode, Mail } from "lucide-react";

type LoginMode = "email" | "qr";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("qr");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { checkDeviceCount, isDeviceRegistered, registerDevice, createLoginRequest } = useDeviceAuth();

  // QR flow state (for email+password device approval)
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [qrExpired, setQrExpired] = useState(false);

  // QR-only login state (WhatsApp Web style)
  const [qrLoginToken, setQrLoginToken] = useState<string | null>(null);
  const [qrLoginWaiting, setQrLoginWaiting] = useState(false);
  const [qrLoginExpired, setQrLoginExpired] = useState(false);

  // Generate QR for QR-only login
  const generateQrLogin = useCallback(async () => {
    try {
      setLoading(true);
      // Insert a device_login_request with user_email='pending' (no credentials needed)
      const info = getDeviceInfoSimple();
      const { data, error } = await supabase
        .from("device_login_requests")
        .insert({
          user_email: "pending",
          device_info: info as any,
        })
        .select("token")
        .single();

      if (error) throw error;
      setQrLoginToken(data.token);
      setQrLoginWaiting(true);
      setQrLoginExpired(false);
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

  // Listen for QR-only login approval
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
            // Use the magic link token to sign in
            try {
              const { error } = await supabase.auth.verifyOtp({
                token_hash: req.auth_token,
                type: "magiclink",
              });
              if (error) throw error;

              // Register this device
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await registerDevice(user.id);
              }

              toast({ title: "সফলভাবে লগইন হয়েছে! ✓" });
              navigate(redirectTo || "/");
            } catch (err: any) {
              toast({ title: "লগইন ব্যর্থ", description: err.message, variant: "destructive" });
            }
            setQrLoginWaiting(false);
            setQrLoginToken(null);
          }
        }
      )
      .subscribe();

    // QR expires in 5 minutes
    const timer = setTimeout(() => {
      setQrLoginExpired(true);
      setQrLoginWaiting(false);
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timer);
    };
  }, [qrLoginToken, qrLoginWaiting, navigate, redirectTo, registerDevice, toast]);

  // Listen for email+password device approval via realtime
  useEffect(() => {
    if (!qrToken || !waitingApproval) return;

    const channel = supabase
      .channel(`device-approval-${qrToken}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "device_login_requests", filter: `token=eq.${qrToken}` },
        async (payload) => {
          const req = payload.new as any;
          if (req.status === "approved" && pendingCredentials) {
            const { error } = await supabase.auth.signInWithPassword({
              email: pendingCredentials.email,
              password: pendingCredentials.password,
            });
            if (!error) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await registerDevice(user.id);
              }
              toast({ title: "ডিভাইস অনুমোদিত হয়েছে! ✓" });
              navigate(redirectTo || "/");
            } else {
              toast({ title: "লগইন ব্যর্থ", description: error.message, variant: "destructive" });
            }
            setWaitingApproval(false);
            setQrToken(null);
            setPendingCredentials(null);
          }
        }
      )
      .subscribe();

    const timer = setTimeout(() => {
      setQrExpired(true);
      setWaitingApproval(false);
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timer);
    };
  }, [qrToken, waitingApproval, pendingCredentials, navigate, redirectTo, registerDevice, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("User not found");

      const alreadyRegistered = await isDeviceRegistered(user.id);
      if (alreadyRegistered) {
        toast({ title: "সফলভাবে লগইন হয়েছে!" });
        navigate(redirectTo || "/");
        return;
      }

      const deviceCount = await checkDeviceCount(user.id);

      if (deviceCount === 0) {
        await registerDevice(user.id);
        toast({ title: "সফলভাবে লগইন হয়েছে!" });
        navigate(redirectTo || "/");
        return;
      }

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

      // Need QR approval
      await supabase.auth.signOut();
      const token = await createLoginRequest(email);
      setQrToken(token);
      setPendingCredentials({ email, password });
      setWaitingApproval(true);
      setQrExpired(false);
      toast({ title: "ডিভাইস অনুমোদন প্রয়োজন", description: "আপনার অন্য ডিভাইস থেকে QR কোড স্ক্যান করুন।" });
    } catch (error: any) {
      toast({ title: "লগইন ব্যর্থ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryQR = async () => {
    if (!pendingCredentials) return;
    setLoading(true);
    try {
      const token = await createLoginRequest(pendingCredentials.email);
      setQrToken(token);
      setWaitingApproval(true);
      setQrExpired(false);
    } catch (err: any) {
      toast({ title: "QR তৈরি ব্যর্থ", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleCancelQR = () => {
    setQrToken(null);
    setPendingCredentials(null);
    setWaitingApproval(false);
    setQrExpired(false);
  };

  const handleRetryQrLogin = async () => {
    setQrLoginToken(null);
    setQrLoginExpired(false);
    setQrLoginWaiting(false);
    await generateQrLogin();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: "Google লগইন ব্যর্থ", description: String(result.error), variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Google লগইন ব্যর্থ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // QR Approval Screen (for email+password flow)
  if (qrToken && (waitingApproval || qrExpired)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-card/60 backdrop-blur-xl border border-border rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">ডিভাইস অনুমোদন</h1>
            <p className="text-sm text-muted-foreground mb-6">
              আপনার লগইন করা ডিভাইসের সেটিংস → নিরাপত্তা থেকে এই QR কোড স্ক্যান করুন
            </p>

            {qrExpired ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm text-destructive font-medium">QR কোডের মেয়াদ শেষ হয়ে গেছে</p>
                </div>
                <Button onClick={handleRetryQR} disabled={loading} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> নতুন QR তৈরি করুন
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                  <QRCodeSVG value={qrToken} size={200} level="H" />
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  অনুমোদনের অপেক্ষায়...
                </div>
                <p className="text-xs text-muted-foreground">৫ মিনিটের মধ্যে স্ক্যান করুন</p>
              </div>
            )}

            <Button variant="ghost" className="mt-4" onClick={handleCancelQR}>
              বাতিল করুন
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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

          {/* Login Mode Toggle */}
          <div className="flex rounded-xl bg-muted/50 p-1 mb-6">
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
                      আপনার ফোনের সেটিংস → নিরাপত্তা → ডিভাইস অনুমোদন থেকে এই QR কোড স্ক্যান করুন
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">৫ মিনিটের মধ্যে স্ক্যান করুন</p>
                  </div>
                </div>
              ) : null}

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/60 px-2 text-muted-foreground">অথবা</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl h-11 gap-3"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>
            </div>
          )}

          {/* Email Login Mode */}
          {loginMode === "email" && (
            <>
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full mb-6 rounded-xl h-11 gap-3"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/60 px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

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
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
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

// Simple device info helper (no hook needed)
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

export default SignIn;
