ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS website_url text;