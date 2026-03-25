
-- Auto-log trigger function for important table changes
CREATE OR REPLACE FUNCTION public.log_table_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_text text;
  desc_text text;
  action_type_val text;
  target_user_id uuid;
  target_email text;
  target_name text;
BEGIN
  -- Determine user
  target_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  SELECT email::text INTO target_email FROM auth.users WHERE id = target_user_id;
  SELECT full_name INTO target_name FROM public.profiles WHERE user_id = target_user_id LIMIT 1;

  -- Build action text based on table and operation
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
      action_text := 'ব্যবসা তথ্য আপডেট';
      desc_text := NEW.business_name || ' তথ্য সম্পাদনা করা হয়েছে';
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

  ELSE
    action_type_val := 'general';
    action_text := TG_OP || ' on ' || TG_TABLE_NAME;
    desc_text := '';
  END IF;

  -- Skip if no meaningful action
  IF action_text IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Insert log (ignore failures)
  BEGIN
    INSERT INTO public.activity_logs (user_id, user_email, user_name, action, action_type, description, page_path)
    VALUES (target_user_id, target_email, target_name, action_text, action_type_val, desc_text, '');
  EXCEPTION WHEN OTHERS THEN
    -- silently ignore
    NULL;
  END;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Attach triggers to important tables
CREATE TRIGGER trg_log_orders AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_profiles AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_tickets AFTER INSERT OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_businesses AFTER INSERT OR UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_user_roles AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_ticket_replies AFTER INSERT ON public.ticket_replies FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_staff_attendance AFTER INSERT OR UPDATE ON public.staff_attendance FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_staff_tasks AFTER INSERT OR UPDATE ON public.staff_tasks FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_contact_submissions AFTER INSERT OR UPDATE ON public.contact_submissions FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
CREATE TRIGGER trg_log_site_settings AFTER UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.log_table_activity();
