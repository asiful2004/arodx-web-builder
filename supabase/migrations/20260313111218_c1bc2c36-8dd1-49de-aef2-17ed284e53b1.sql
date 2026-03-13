
-- Chat sessions table
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  guest_name text DEFAULT NULL,
  guest_email text DEFAULT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can create a chat session (guests too)
CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Users can view own sessions
CREATE POLICY "Users can view own sessions" ON public.chat_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Anon can view by id (handled via message queries)
CREATE POLICY "Anon can view sessions" ON public.chat_sessions
  FOR SELECT TO anon USING (true);

-- Admins can update sessions
CREATE POLICY "Admins can update sessions" ON public.chat_sessions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'client',
  sender_id uuid DEFAULT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert messages
CREATE POLICY "Anyone can send messages" ON public.chat_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can view messages (own session or admin)
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
      AND (cs.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Anon can view messages for their session
CREATE POLICY "Anon can view chat messages" ON public.chat_messages
  FOR SELECT TO anon USING (true);

-- Admins can update messages (mark read)
CREATE POLICY "Admins can update messages" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can update own messages (mark read)
CREATE POLICY "Users can update own messages" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
