-- Add logo_url column to businesses
ALTER TABLE public.businesses ADD COLUMN logo_url text DEFAULT NULL;

-- Create storage bucket for business logos
INSERT INTO storage.buckets (id, name, public) VALUES ('business-logos', 'business-logos', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-logos');

-- Allow users to update/delete own logos
CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);