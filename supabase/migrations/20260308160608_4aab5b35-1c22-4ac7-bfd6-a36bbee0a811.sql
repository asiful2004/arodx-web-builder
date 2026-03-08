
-- Add refund_status to orders
ALTER TABLE public.orders ADD COLUMN refund_status text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN refund_reason text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN refund_requested_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN refund_resolved_at timestamp with time zone DEFAULT NULL;
