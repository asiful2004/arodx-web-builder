
-- Add delivered_at column to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS delivered_at timestamptz DEFAULT NULL;

-- Create cleanup function for delivered businesses (7 days after delivery)
CREATE OR REPLACE FUNCTION public.cleanup_delivered_businesses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete associated orders first
  DELETE FROM public.orders WHERE id IN (
    SELECT order_id FROM public.businesses 
    WHERE delivered_at IS NOT NULL 
    AND delivered_at < now() - interval '7 days'
    AND order_id IS NOT NULL
  );
  -- Then delete the businesses
  DELETE FROM public.businesses 
  WHERE delivered_at IS NOT NULL 
  AND delivered_at < now() - interval '7 days';
END;
$$;

-- Update the log_table_activity function to handle delivered businesses
CREATE OR REPLACE FUNCTION public.log_table_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  action_text text;
  desc_text text;
  action_type_val text;
  target_user_id uuid;
  target_email text;
  target_name text;
BEGIN
  target_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  SELECT email::text INTO target_email FROM auth.users WHERE id = target_user_id;
  SELECT full_name INTO target_name FROM public.profiles WHERE user_id = target_user_id LIMIT 1;

  IF TG_TABLE_NAME = 'orders' THEN
    action_type_val := 'order';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন অর্ডার তৈরি';
      desc_text := 'প্যাকেজ: ' || NEW.package_name || ', পরিমাণ: ' || NEW.amount;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'অর্ডার আপডেট';
      desc_text := 'অর্ডার #' || SUBSTRING(NEW.id::text, 1, 8) || ' স্ট্যাটাস: ' || NEW.status;
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        desc_text := desc_text || ' (আগে: ' || OLD.status || ')';
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      action_text := 'অর্ডার ডিলিট';
      desc_text := 'অর্ডার #' || SUBSTRING(OLD.id::text, 1, 8) || ' ডিলিট করা হয়েছে';
    END IF;

  ELSIF TG_TABLE_NAME = 'profiles' THEN
    action_type_val := 'profile';
    target_user_id := NEW.user_id;
    SELECT email::text INTO target_email FROM auth.users WHERE id = NEW.user_id;
    target_name := NEW.full_name;
    IF TG_OP = 'UPDATE' THEN
      action_text := 'প্রোফাইল আপডেট';
      desc_text := COALESCE(NEW.full_name, '') || ' প্রোফাইল সম্পাদনা করেছে';
    END IF;

  ELSIF TG_TABLE_NAME = 'tickets' THEN
    action_type_val := 'ticket';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন টিকেট তৈরি';
      desc_text := NEW.ticket_number || ' - ' || NEW.subject;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'টিকেট আপডেট';
      desc_text := NEW.ticket_number || ' স্ট্যাটাস: ' || NEW.status;
    END IF;

  ELSIF TG_TABLE_NAME = 'businesses' THEN
    action_type_val := 'business';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন ব্যবসা রেজিস্ট্রেশন';
      desc_text := NEW.business_name || ' (' || NEW.business_category || ')';
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.delivered_at IS NULL AND NEW.delivered_at IS NOT NULL THEN
        action_text := 'ব্যবসা ডেলিভারি সম্পন্ন';
        desc_text := NEW.business_name || ' - সার্ভিস ডেলিভারি দেওয়া হয়েছে (৭ দিন পর অটো-ডিলিট হবে)';
      ELSE
        action_text := 'ব্যবসা তথ্য আপডেট';
        desc_text := NEW.business_name || ' তথ্য সম্পাদনা করা হয়েছে';
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      action_text := 'ব্যবসা ডিলিট';
      desc_text := OLD.business_name || ' ডিলিট করা হয়েছে';
    END IF;

  ELSIF TG_TABLE_NAME = 'user_roles' THEN
    action_type_val := 'admin';
    IF TG_OP = 'INSERT' THEN
      action_text := 'রোল যোগ করা হয়েছে';
      desc_text := 'ইউজারকে ' || NEW.role || ' রোল দেওয়া হয়েছে';
    ELSIF TG_OP = 'DELETE' THEN
      action_text := 'রোল মুছে ফেলা হয়েছে';
      desc_text := OLD.role || ' রোল সরিয়ে দেওয়া হয়েছে';
      target_user_id := COALESCE(auth.uid(), OLD.user_id);
    END IF;

  ELSIF TG_TABLE_NAME = 'ticket_replies' THEN
    action_type_val := 'ticket';
    IF TG_OP = 'INSERT' THEN
      action_text := CASE WHEN NEW.is_admin_reply THEN 'অ্যাডমিন টিকেট রিপ্লাই' ELSE 'ইউজার টিকেট রিপ্লাই' END;
      desc_text := 'টিকেটে রিপ্লাই দেওয়া হয়েছে';
    END IF;

  ELSIF TG_TABLE_NAME = 'staff_attendance' THEN
    action_type_val := 'staff';
    target_user_id := NEW.user_id;
    SELECT email::text INTO target_email FROM auth.users WHERE id = NEW.user_id;
    SELECT full_name INTO target_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    IF TG_OP = 'INSERT' THEN
      action_text := 'উপস্থিতি রেকর্ড';
      desc_text := NEW.attendance_type || ' - ' || NEW.date::text;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'উপস্থিতি আপডেট';
      desc_text := NEW.attendance_type || ' - চেক ইন/আউট আপডেট';
    END IF;

  ELSIF TG_TABLE_NAME = 'staff_tasks' THEN
    action_type_val := 'staff';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন টাস্ক তৈরি';
      desc_text := NEW.title || ' (' || NEW.priority || ')';
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'টাস্ক আপডেট';
      desc_text := NEW.title || ' - স্ট্যাটাস: ' || NEW.status;
    END IF;

  ELSIF TG_TABLE_NAME = 'contact_submissions' THEN
    action_type_val := 'general';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন কন্টাক্ট সাবমিশন';
      desc_text := NEW.name || ' - ' || NEW.email;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'কন্টাক্ট সাবমিশন আপডেট';
      desc_text := 'স্ট্যাটাস: ' || NEW.status;
    END IF;

  ELSIF TG_TABLE_NAME = 'site_settings' THEN
    action_type_val := 'settings';
    IF TG_OP = 'UPDATE' THEN
      action_text := 'সাইট সেটিংস আপডেট';
      desc_text := NEW.key || ' সেটিং পরিবর্তন করা হয়েছে';
    END IF;

  ELSIF TG_TABLE_NAME = 'invoices' THEN
    action_type_val := 'order';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন ইনভয়েস তৈরি';
      desc_text := NEW.invoice_number || ' - পরিমাণ: ' || NEW.amount;
    END IF;

  ELSIF TG_TABLE_NAME = 'notifications' THEN
    action_type_val := 'general';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন নোটিফিকেশন';
      desc_text := NEW.title;
    END IF;

  ELSIF TG_TABLE_NAME = 'staff_leave_requests' THEN
    action_type_val := 'staff';
    target_user_id := NEW.user_id;
    SELECT email::text INTO target_email FROM auth.users WHERE id = NEW.user_id;
    SELECT full_name INTO target_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    IF TG_OP = 'INSERT' THEN
      action_text := 'ছুটির আবেদন';
      desc_text := NEW.leave_type || ' - ' || NEW.start_date::text || ' থেকে ' || NEW.end_date::text;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'ছুটির আবেদন আপডেট';
      desc_text := 'স্ট্যাটাস: ' || NEW.status;
    END IF;

  ELSIF TG_TABLE_NAME = 'job_applications' THEN
    action_type_val := 'staff';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন চাকরির আবেদন';
      desc_text := NEW.full_name || ' - ' || NEW.job_category;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'চাকরির আবেদন আপডেট';
      desc_text := NEW.full_name || ' - স্ট্যাটাস: ' || NEW.status;
    END IF;

  ELSIF TG_TABLE_NAME = 'chat_sessions' THEN
    action_type_val := 'general';
    IF TG_OP = 'INSERT' THEN
      action_text := 'নতুন চ্যাট সেশন';
      desc_text := COALESCE(NEW.guest_name, 'অজানা') || ' - ' || COALESCE(NEW.guest_email, '');
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        action_text := 'চ্যাট সেশন ' || NEW.status;
        desc_text := COALESCE(NEW.guest_name, 'অজানা');
      END IF;
    END IF;

  ELSE
    action_type_val := 'general';
    action_text := TG_OP || ' on ' || TG_TABLE_NAME;
    desc_text := '';
  END IF;

  IF action_text IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  BEGIN
    INSERT INTO public.activity_logs (user_id, user_email, user_name, action, action_type, description, page_path)
    VALUES (target_user_id, target_email, target_name, action_text, action_type_val, desc_text, '');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- Add triggers for tables that don't have them yet
DO $$
BEGIN
  -- invoices trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_invoices') THEN
    CREATE TRIGGER trg_log_invoices AFTER INSERT ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
  END IF;

  -- staff_leave_requests trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_staff_leave') THEN
    CREATE TRIGGER trg_log_staff_leave AFTER INSERT OR UPDATE ON public.staff_leave_requests
    FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
  END IF;

  -- job_applications trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_job_applications') THEN
    CREATE TRIGGER trg_log_job_applications AFTER INSERT OR UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
  END IF;

  -- chat_sessions trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_chat_sessions') THEN
    CREATE TRIGGER trg_log_chat_sessions AFTER INSERT OR UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
  END IF;

  -- businesses DELETE trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_businesses_delete') THEN
    CREATE TRIGGER trg_log_businesses_delete AFTER DELETE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
  END IF;

  -- orders DELETE trigger  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_orders_delete') THEN
    CREATE TRIGGER trg_log_orders_delete AFTER DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
  END IF;
END $$;
