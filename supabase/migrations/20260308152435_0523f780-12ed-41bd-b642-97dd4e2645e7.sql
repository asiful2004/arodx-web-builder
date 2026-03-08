
-- 1. Add 'client' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- 2. Auto-assign 'user' role on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  -- Auto-assign 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 3. Function to upgrade user to client when order is confirmed
CREATE OR REPLACE FUNCTION public.upgrade_to_client_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only when status changes to 'confirmed' and user_id is set
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' AND NEW.user_id IS NOT NULL THEN
    -- Add 'client' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
    -- Remove 'user' role (upgrade)
    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'user';
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Trigger on orders table for auto upgrade
CREATE TRIGGER on_order_confirmed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.upgrade_to_client_on_confirm();
