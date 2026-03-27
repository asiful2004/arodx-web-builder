-- Add email_verified to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Set existing confirmed users as verified
UPDATE public.profiles p
SET email_verified = true
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = p.user_id AND u.email_confirmed_at IS NOT NULL
);

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  code_type text NOT NULL DEFAULT 'signup',
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow edge functions with service role to manage, no public access
CREATE POLICY "Service role only" ON public.verification_codes
  FOR ALL USING (false);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_type
ON public.verification_codes (email, code_type, used, expires_at);

-- Cleanup expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.verification_codes WHERE expires_at < now() OR used = true;
END;
$$;

-- Schedule cleanup every hour
SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT public.cleanup_expired_verification_codes()');