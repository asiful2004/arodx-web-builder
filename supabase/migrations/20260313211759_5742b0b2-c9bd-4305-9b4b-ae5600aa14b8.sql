
-- Create task priority and status enums
CREATE TYPE public.staff_task_status AS ENUM ('pending', 'in_progress', 'review', 'completed', 'cancelled');
CREATE TYPE public.staff_task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create staff tasks table
CREATE TABLE public.staff_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  target_role TEXT NOT NULL,
  status staff_task_status NOT NULL DEFAULT 'pending',
  priority staff_task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;

-- HR and Admin can do everything
CREATE POLICY "HR and Admin full access on tasks"
ON public.staff_tasks
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
);

-- Sub-role users can view their own assigned tasks
CREATE POLICY "Users can view assigned tasks"
ON public.staff_tasks
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- Sub-role users can update their own task status
CREATE POLICY "Users can update own task status"
ON public.staff_tasks
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_staff_tasks_updated_at
  BEFORE UPDATE ON public.staff_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_tasks;
