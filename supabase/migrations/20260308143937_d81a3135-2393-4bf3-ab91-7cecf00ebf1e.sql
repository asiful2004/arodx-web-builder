
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  business_address TEXT,
  domain_type TEXT NOT NULL DEFAULT 'package' CHECK (domain_type IN ('own', 'package')),
  domain_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Users can view their own businesses
CREATE POLICY "Users can view own businesses" ON public.businesses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own businesses
CREATE POLICY "Users can insert own businesses" ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own businesses
CREATE POLICY "Users can update own businesses" ON public.businesses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all businesses
CREATE POLICY "Admins can view all businesses" ON public.businesses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
