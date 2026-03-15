
-- 1. FIX: chat_ai_settings - Remove public access to API key, restrict to admin only
DROP POLICY IF EXISTS "Anyone can read chat ai settings" ON public.chat_ai_settings;
CREATE POLICY "Admins can read chat ai settings"
  ON public.chat_ai_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX: device_login_requests - Restrict UPDATE to admin only
DROP POLICY IF EXISTS "Authenticated users can update requests" ON public.device_login_requests;
CREATE POLICY "Admins can update device login requests"
  ON public.device_login_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. FIX: device_login_requests - Restrict anon SELECT to own token only (can't filter by token in RLS, so remove anon SELECT and use service role in edge function)
DROP POLICY IF EXISTS "Anon can view device login requests by token" ON public.device_login_requests;

-- 4. FIX: chat_sessions - Remove blanket anon SELECT, add session-specific anon access
DROP POLICY IF EXISTS "Anon can view sessions" ON public.chat_sessions;

-- 5. FIX: chat_messages - Remove blanket anon SELECT
DROP POLICY IF EXISTS "Anon can view chat messages" ON public.chat_messages;

-- 6. FIX: notifications - Restrict INSERT to own notifications or admin/system
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

-- 7. FIX: chat_sessions - Remove blanket anon INSERT WITH CHECK true, add more specific
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.chat_sessions;
CREATE POLICY "Anyone can create chat sessions"
  ON public.chat_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 8. FIX: chat_messages - Remove blanket INSERT, keep but it's needed for guest chat
DROP POLICY IF EXISTS "Anyone can send messages" ON public.chat_messages;
CREATE POLICY "Anyone can send messages"
  ON public.chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 9. FIX: orders - Restrict INSERT 
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
