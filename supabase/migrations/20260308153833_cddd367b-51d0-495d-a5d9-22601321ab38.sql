
-- Add subscription/billing fields to orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS renewal_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- Auto-set renewal_date when order is confirmed
CREATE OR REPLACE FUNCTION public.set_renewal_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    NEW.is_active := true;
    IF NEW.billing_period = 'monthly' THEN
      NEW.renewal_date := NOW() + INTERVAL '1 month';
    ELSE
      NEW.renewal_date := NOW() + INTERVAL '1 year';
    END IF;
  END IF;
  
  IF NEW.status = 'cancelled' THEN
    NEW.is_active := false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger (before update so we can modify NEW)
DROP TRIGGER IF EXISTS on_order_status_set_renewal ON public.orders;
CREATE TRIGGER on_order_status_set_renewal
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_renewal_on_confirm();

-- Create invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) NOT NULL,
  user_id uuid NOT NULL,
  invoice_number text NOT NULL,
  amount text NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  payment_method text,
  transaction_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Users can view own invoices
CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert invoices
CREATE POLICY "Admins can manage invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow system inserts (for triggers)
CREATE POLICY "System can insert invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Auto-create invoice when order is confirmed
CREATE OR REPLACE FUNCTION public.create_invoice_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inv_number text;
  p_start timestamp with time zone;
  p_end timestamp with time zone;
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' AND NEW.user_id IS NOT NULL THEN
    inv_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 8);
    p_start := NOW();
    IF NEW.billing_period = 'monthly' THEN
      p_end := NOW() + INTERVAL '1 month';
    ELSE
      p_end := NOW() + INTERVAL '1 year';
    END IF;
    
    INSERT INTO public.invoices (order_id, user_id, invoice_number, amount, period_start, period_end, status, payment_method, transaction_id)
    VALUES (NEW.id, NEW.user_id, inv_number, NEW.amount, p_start, p_end, 'paid', NEW.payment_method, NEW.transaction_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_order_create_invoice ON public.orders;
CREATE TRIGGER on_order_create_invoice
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invoice_on_confirm();
