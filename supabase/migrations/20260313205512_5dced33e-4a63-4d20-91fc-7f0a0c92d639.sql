
-- HR can view all user roles (to manage staff)
CREATE POLICY "HR can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'hr'));

-- HR can insert roles (assign sub-roles to staff)
CREATE POLICY "HR can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'hr')
  AND role IN ('graphics_designer', 'web_developer', 'project_manager', 'digital_marketer', 'staff')
);

-- HR can delete roles (remove sub-roles from staff)
CREATE POLICY "HR can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'hr')
  AND role IN ('graphics_designer', 'web_developer', 'project_manager', 'digital_marketer', 'staff')
);

-- HR can view all profiles (to see staff names)
CREATE POLICY "HR can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'hr'));

-- Staff can view all profiles (for team visibility)
CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'staff'));
