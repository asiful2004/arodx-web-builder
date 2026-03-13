
CREATE TABLE public.chat_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'openai',
  api_key text NOT NULL DEFAULT '',
  model_name text NOT NULL DEFAULT 'gpt-4o-mini',
  enabled boolean NOT NULL DEFAULT false,
  auto_reply_delay integer NOT NULL DEFAULT 10,
  system_prompt text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Only admins can manage
ALTER TABLE public.chat_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chat ai settings"
ON public.chat_ai_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.chat_ai_settings (provider, api_key, model_name, enabled, auto_reply_delay, system_prompt)
VALUES ('openai', '', 'gpt-4o-mini', false, 10, '');
