
-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  address TEXT,
  nid_number TEXT NOT NULL,
  nid_front_url TEXT NOT NULL,
  nid_back_url TEXT NOT NULL,
  face_photo_url TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'full_time', -- full_time, part_time, freelancer
  job_category TEXT NOT NULL, -- project_manager, web_developer, digital_marketer, graphics_designer, other
  other_category TEXT, -- if job_category is 'other'
  experience_years INTEGER,
  experience_details TEXT,
  portfolio_url TEXT NOT NULL,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  auto_delete_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications"
ON public.job_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view own applications
CREATE POLICY "Users can view own applications"
ON public.job_applications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- HR/Admin can view all applications
CREATE POLICY "HR Admin can view all applications"
ON public.job_applications FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- HR/Admin can update applications
CREATE POLICY "HR Admin can update applications"
ON public.job_applications FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- HR/Admin can delete applications
CREATE POLICY "HR Admin can delete applications"
ON public.job_applications FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for job application files
INSERT INTO storage.buckets (id, name, public) VALUES ('job-applications', 'job-applications', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job-applications bucket
CREATE POLICY "Authenticated users can upload job app files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'job-applications');

CREATE POLICY "Anyone can view job app files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'job-applications');

CREATE POLICY "HR Admin can delete job app files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'job-applications' AND (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr'))
));
