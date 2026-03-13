
-- Drop old staff profile policy
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- Update HR insert policy to not include 'staff'
DROP POLICY IF EXISTS "HR can insert roles" ON public.user_roles;
CREATE POLICY "HR can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'hr')
  AND role IN ('graphics_designer', 'web_developer', 'project_manager', 'digital_marketer')
);

-- Update HR delete policy to not include 'staff'
DROP POLICY IF EXISTS "HR can delete roles" ON public.user_roles;
CREATE POLICY "HR can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'hr')
  AND role IN ('graphics_designer', 'web_developer', 'project_manager', 'digital_marketer')
);

-- Allow sub-role users to view all profiles (for team visibility)
CREATE POLICY "Sub-role users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'hr')
  OR public.has_role(auth.uid(), 'graphics_designer')
  OR public.has_role(auth.uid(), 'web_developer')
  OR public.has_role(auth.uid(), 'project_manager')
  OR public.has_role(auth.uid(), 'digital_marketer')
);
