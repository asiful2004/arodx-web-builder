
-- Device tracking table
CREATE TABLE public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL DEFAULT 'Unknown Device',
  browser text,
  os text,
  device_fingerprint text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_active timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Device login requests table (for QR code approval)
CREATE TABLE public.device_login_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  user_email text NOT NULL,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- RLS for user_devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON public.user_devices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON public.user_devices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON public.user_devices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON public.user_devices FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS for device_login_requests
ALTER TABLE public.device_login_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert device login requests"
  ON public.device_login_requests FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view requests by email"
  ON public.device_login_requests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update requests"
  ON public.device_login_requests FOR UPDATE TO authenticated
  USING (true);

-- Enable realtime for device_login_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_login_requests;
