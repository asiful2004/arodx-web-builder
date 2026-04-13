DROP POLICY IF EXISTS "Admin upload public-assets" ON storage.objects;
CREATE POLICY "Admin upload public-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-assets'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admin update public-assets" ON storage.objects;
CREATE POLICY "Admin update public-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public-assets'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'public-assets'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admin delete public-assets" ON storage.objects;
CREATE POLICY "Admin delete public-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-assets'
  AND public.has_role(auth.uid(), 'admin')
);