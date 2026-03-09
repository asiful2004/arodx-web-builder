
-- Add image_url and reply_to_id columns to ticket_replies
ALTER TABLE public.ticket_replies ADD COLUMN image_url TEXT DEFAULT NULL;
ALTER TABLE public.ticket_replies ADD COLUMN reply_to_id UUID DEFAULT NULL REFERENCES public.ticket_replies(id) ON DELETE SET NULL;

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload ticket attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments');

-- Storage RLS: anyone can view
CREATE POLICY "Anyone can view ticket attachments" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'ticket-attachments');
