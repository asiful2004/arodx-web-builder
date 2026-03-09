
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify client when admin replies to ticket
CREATE OR REPLACE FUNCTION public.notify_on_ticket_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_rec RECORD;
BEGIN
  SELECT id, user_id, ticket_number, subject FROM public.tickets WHERE id = NEW.ticket_id INTO ticket_rec;
  
  IF NEW.is_admin_reply = true THEN
    -- Notify the client
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      ticket_rec.user_id,
      'সাপোর্ট টিম রিপ্লাই দিয়েছে',
      ticket_rec.ticket_number || ' - ' || ticket_rec.subject,
      'ticket_reply',
      '/dashboard/tickets/' || ticket_rec.id
    );
  ELSE
    -- Notify all admins when client replies
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT ur.user_id, 
           'ক্লায়েন্ট রিপ্লাই দিয়েছে',
           ticket_rec.ticket_number || ' - ' || ticket_rec.subject,
           'ticket_reply',
           '/admin/tickets/' || ticket_rec.id
    FROM public.user_roles ur WHERE ur.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_reply_notify
  AFTER INSERT ON public.ticket_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_ticket_reply();

-- Trigger: notify client when ticket status changes
CREATE OR REPLACE FUNCTION public.notify_on_ticket_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'in_progress' THEN status_label := 'প্রগ্রেসে আছে';
      WHEN 'waiting' THEN status_label := 'আপনার রিপ্লাই প্রয়োজন';
      WHEN 'resolved' THEN status_label := 'সমাধান হয়েছে';
      WHEN 'closed' THEN status_label := 'বন্ধ করা হয়েছে';
      ELSE status_label := NEW.status;
    END CASE;
    
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      'টিকেট স্ট্যাটাস আপডেট',
      NEW.ticket_number || ' - ' || status_label,
      'ticket_status',
      '/dashboard/tickets/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_status_change_notify
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_ticket_status_change();

-- Trigger: notify admins when new ticket created
CREATE OR REPLACE FUNCTION public.notify_on_new_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT ur.user_id,
         'নতুন সাপোর্ট টিকেট',
         NEW.ticket_number || ' - ' || NEW.subject,
         'new_ticket',
         '/admin/tickets/' || NEW.id
  FROM public.user_roles ur WHERE ur.role = 'admin';
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_ticket_notify
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_ticket();
