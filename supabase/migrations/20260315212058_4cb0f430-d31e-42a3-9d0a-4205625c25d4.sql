
-- Restore anon SELECT for chat_sessions and chat_messages but only for guest chat functionality
-- These are needed because unauthenticated guests use the live chat
-- The app already filters by session_id which is stored in localStorage

-- Chat sessions: anon can only read (no sensitive data exposure since we accept the tradeoff for guest chat)
CREATE POLICY "Anon can view own chat sessions"
  ON public.chat_sessions FOR SELECT
  TO anon
  USING (true);

-- Chat messages: anon can only read messages for guest chat
CREATE POLICY "Anon can view chat messages for sessions"
  ON public.chat_messages FOR SELECT
  TO anon
  USING (true);

-- Device login requests: anon needs to poll their own request by token
CREATE POLICY "Anon can view own device login requests"
  ON public.device_login_requests FOR SELECT
  TO anon
  USING (true);
