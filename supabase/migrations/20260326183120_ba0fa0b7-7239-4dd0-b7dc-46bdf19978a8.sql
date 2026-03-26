
-- Create storage bucket for site assets (logos, favicons, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('site-assets', 'site-assets', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read site assets
CREATE POLICY "Public read site-assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'site-assets');

-- Allow authenticated admins to upload/update/delete site assets
CREATE POLICY "Admin upload site-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update site-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete site-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
