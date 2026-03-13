
-- Add message_type and attachment_url to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS attachment_url text DEFAULT NULL;

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can upload
CREATE POLICY "Anyone can upload chat attachments"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Storage RLS: anyone can view
CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'chat-attachments');
