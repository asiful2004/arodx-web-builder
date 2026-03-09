
-- Create ticket priority enum
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create ticket status enum
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed');

-- Create ticket category enum
CREATE TYPE public.ticket_category AS ENUM ('billing', 'technical', 'domain', 'general', 'feature_request', 'bug_report');

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.ticket_category NOT NULL DEFAULT 'general',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'open',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create ticket replies table
CREATE TABLE public.ticket_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

-- Tickets RLS policies
CREATE POLICY "Users can view own tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own open tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('open', 'waiting'));

-- Ticket replies RLS policies
CREATE POLICY "Users can view replies on own tickets" ON public.ticket_replies
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tickets WHERE tickets.id = ticket_replies.ticket_id AND tickets.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all replies" ON public.ticket_replies
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can reply to own tickets" ON public.ticket_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tickets WHERE tickets.id = ticket_replies.ticket_id AND (tickets.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can reply to any ticket" ON public.ticket_replies
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

-- Auto-update updated_at on tickets
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_replies;

-- Generate ticket number function
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.tickets;
  
  NEW.ticket_number := 'TKT-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_number();
