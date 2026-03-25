
-- Activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  action text NOT NULL,
  action_type text NOT NULL DEFAULT 'general',
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  page_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Any authenticated user can insert logs
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can delete old logs
CREATE POLICY "Admins can delete activity logs"
  ON public.activity_logs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs (action_type);

-- Auto-cleanup function: delete logs older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.activity_logs WHERE created_at < now() - interval '7 days';
END;
$$;

-- Enable realtime for activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
