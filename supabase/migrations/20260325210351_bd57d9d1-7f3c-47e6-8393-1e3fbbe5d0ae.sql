
-- Allow admins to insert businesses for any user
CREATE POLICY "Admins can insert businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any business
CREATE POLICY "Admins can update all businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete businesses
CREATE POLICY "Admins can delete businesses"
ON public.businesses
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
