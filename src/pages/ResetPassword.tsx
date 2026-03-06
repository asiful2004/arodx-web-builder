import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (!hashParams.get("type") || hashParams.get("type") !== "recovery") {
      // Also check query params
      const queryParams = new URLSearchParams(window.location.search);
      if (!queryParams.get("type") || queryParams.get("type") !== "recovery") {
        // Allow access anyway for UX, the updateUser call will fail if no session
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "পাসওয়ার্ড মিলছে না", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "পাসওয়ার্ড আপডেট হয়েছে!" });
      navigate("/signin");
    } catch (error: any) {
      toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
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
            <h1 className="text-2xl font-bold text-foreground mt-4">Reset Password</h1>
            <p className="text-muted-foreground mt-2">Enter your new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-border"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background/50 border-border"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>

          <p className="text-center text-sm mt-6">
            <Link to="/signin" className="text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
