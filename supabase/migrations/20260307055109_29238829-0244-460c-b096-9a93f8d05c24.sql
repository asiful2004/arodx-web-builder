CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  package_name TEXT NOT NULL,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  amount TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Only authenticated users can view their orders" ON public.orders FOR SELECT TO authenticated USING (true);