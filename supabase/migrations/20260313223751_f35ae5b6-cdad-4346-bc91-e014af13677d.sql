
-- Drop the old ALL policy for HR and Admin
DROP POLICY IF EXISTS "HR and Admin full access on tasks" ON public.staff_tasks;

-- Admin keeps full access
CREATE POLICY "Admin full access on tasks"
ON public.staff_tasks
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- HR can SELECT all tasks
CREATE POLICY "HR can view all tasks"
ON public.staff_tasks
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role));

-- HR can INSERT tasks
CREATE POLICY "HR can create tasks"
ON public.staff_tasks
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'hr'::app_role));

-- HR can DELETE tasks
CREATE POLICY "HR can delete tasks"
ON public.staff_tasks
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role));
