import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError("Google login was cancelled or failed.");
        setTimeout(() => navigate("/signin"), 3000);
        return;
      }

      if (!code) {
        setError("No authorization code received.");
        setTimeout(() => navigate("/signin"), 3000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`;

        const { data, error: fnError } = await supabase.functions.invoke("google-auth", {
          body: { code, redirect_uri: redirectUri },
        });

        if (fnError || data?.error) {
          throw new Error(data?.error || fnError?.message || "Authentication failed");
        }

        // Use the magic link token to sign in
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (otpError) {
          throw otpError;
        }

        navigate("/");
      } catch (err: any) {
        console.error("Google callback error:", err);
        setError(err.message || "Login failed. Please try again.");
        setTimeout(() => navigate("/signin"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Google দিয়ে লগইন হচ্ছে...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
