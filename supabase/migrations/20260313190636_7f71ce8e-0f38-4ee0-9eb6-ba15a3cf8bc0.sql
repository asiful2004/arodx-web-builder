CREATE POLICY "Anyone can read chat ai settings"
ON public.chat_ai_settings
FOR SELECT
TO authenticated, anon
USING (true);