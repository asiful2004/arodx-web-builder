-- Table to store sensitive admin-only secrets (like OAuth client secrets)
CREATE TABLE public.admin_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage admin_secrets"
  ON public.admin_secrets
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));