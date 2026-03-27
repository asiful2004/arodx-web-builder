
-- Function to send Discord webhook via edge function
CREATE OR REPLACE FUNCTION public.notify_discord_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  event_type text;
  payload jsonb;
  edge_url text;
  anon_key text;
BEGIN
  -- Determine event type and build payload
  IF TG_TABLE_NAME = 'tickets' AND TG_OP = 'INSERT' THEN
    event_type := 'ticket';
    payload := jsonb_build_object(
      'ticket_number', NEW.ticket_number,
      'subject', NEW.subject,
      'category', NEW.category,
      'priority', NEW.priority,
      'status', NEW.status
    );
  ELSIF TG_TABLE_NAME = 'chat_sessions' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'chat';
      payload := jsonb_build_object(
        'guest_name', NEW.guest_name,
        'guest_email', NEW.guest_email,
        'guest_phone', NEW.guest_phone,
        'status', 'active'
      );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'closed' THEN
      event_type := 'chat';
      payload := jsonb_build_object(
        'guest_name', NEW.guest_name,
        'guest_email', NEW.guest_email,
        'guest_phone', NEW.guest_phone,
        'status', 'closed'
      );
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'orders' AND TG_OP = 'INSERT' THEN
    event_type := 'order';
    payload := jsonb_build_object(
      'customer_name', NEW.customer_name,
      'customer_phone', NEW.customer_phone,
      'customer_email', NEW.customer_email,
      'package_name', NEW.package_name,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method,
      'billing_period', NEW.billing_period
    );
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get Supabase URL from config
  SELECT value::text INTO edge_url FROM public.admin_secrets WHERE key = 'SUPABASE_URL';
  SELECT value::text INTO anon_key FROM public.admin_secrets WHERE key = 'SUPABASE_ANON_KEY';

  -- Call edge function via pg_net
  IF edge_url IS NOT NULL AND anon_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := edge_url || '/functions/v1/discord-notify',
      body := jsonb_build_object('event_type', event_type, 'data', payload),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never break the main operation
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER discord_notify_ticket
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_discord_webhook();

CREATE TRIGGER discord_notify_chat
  AFTER INSERT OR UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_discord_webhook();

CREATE TRIGGER discord_notify_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_discord_webhook();
