
-- Add auth_token column for storing magic link token
ALTER TABLE public.device_login_requests 
ADD COLUMN IF NOT EXISTS auth_token text;

-- Make user_email have a default for QR-only login
ALTER TABLE public.device_login_requests 
ALTER COLUMN user_email SET DEFAULT 'pending';

-- Allow anon users to insert device login requests (for QR login without credentials)
CREATE POLICY "Anon can insert device login requests"
ON public.device_login_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to select their own request by token
CREATE POLICY "Anon can view device login requests by token"
ON public.device_login_requests
FOR SELECT
TO anon
USING (true);
