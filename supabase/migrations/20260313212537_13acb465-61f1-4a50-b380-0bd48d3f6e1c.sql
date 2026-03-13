
-- Attendance type enum
CREATE TYPE public.attendance_type AS ENUM ('present', 'leave', 'half_day', 'late');

-- Leave type enum
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'annual', 'emergency', 'other');

-- Leave status enum
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Daily attendance table
CREATE TABLE public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC(5,2) DEFAULT 0,
  attendance_type public.attendance_type NOT NULL DEFAULT 'present',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Leave requests table
CREATE TABLE public.staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  leave_type public.leave_type NOT NULL DEFAULT 'casual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leave_requests ENABLE ROW LEVEL SECURITY;

-- Attendance RLS: users can view/manage own, HR/Admin can do all
CREATE POLICY "Users can view own attendance" ON public.staff_attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Users can insert own attendance" ON public.staff_attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attendance" ON public.staff_attendance
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Leave requests RLS
CREATE POLICY "Users can view own leave requests" ON public.staff_leave_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Users can create leave requests" ON public.staff_leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "HR/Admin can update leave requests" ON public.staff_leave_requests
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Enable realtime for attendance
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_leave_requests;

-- Auto update updated_at
CREATE TRIGGER update_staff_attendance_updated_at BEFORE UPDATE ON public.staff_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_leave_requests_updated_at BEFORE UPDATE ON public.staff_leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
